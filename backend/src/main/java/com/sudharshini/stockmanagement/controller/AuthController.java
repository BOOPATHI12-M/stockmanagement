package com.sudharshini.stockmanagement.controller;

import com.sudharshini.stockmanagement.entity.Address;
import com.sudharshini.stockmanagement.entity.Otp;
import com.sudharshini.stockmanagement.entity.User;
import com.sudharshini.stockmanagement.repository.AddressRepository;
import com.sudharshini.stockmanagement.repository.OtpRepository;
import com.sudharshini.stockmanagement.repository.UserRepository;
import com.sudharshini.stockmanagement.service.EmailService;
import com.sudharshini.stockmanagement.util.JwtUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Authentication Controller
 * Handles customer Google OAuth and admin login
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private OtpRepository otpRepository;
    
    @Autowired
    private AddressRepository addressRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Value("${file.upload.dir:uploads}")
    private String uploadBaseDir;
    
    private static final int OTP_EXPIRY_MINUTES = 10;
    
    private Path getProfilePhotoUploadPath() {
        Path path = Paths.get(uploadBaseDir, "profiles");
        try {
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create profile photo upload directory", e);
        }
        return path;
    }
    
    private Path getProofDocumentsUploadPath() {
        Path path = Paths.get(uploadBaseDir, "proofs");
        try {
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create proof documents upload directory", e);
        }
        return path;
    }
    
    /**
     * Helper method to upload proof documents
     */
    private String uploadProofDocument(MultipartFile file, Long userId, String documentType) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        
        // Validate file
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("File must be an image");
        }
        
        // Check file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Image size should be less than 5MB");
        }
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = "proof_" + userId + "_" + documentType + "_" + UUID.randomUUID().toString() + extension;
        
        // Save file
        Path uploadPath = getProofDocumentsUploadPath();
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Return URL
        return "/api/auth/admin/proof-documents/" + filename;
    }
    
    /**
     * Google OAuth login for customers
     */
    @PostMapping("/customer/google")
    @Transactional
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String name = request.get("name");
            String googleId = request.get("googleId");
            
            // Validate required fields
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Email is required"));
            }
            if (googleId == null || googleId.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Google ID is required"));
            }
            
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;
            
            if (existingUser.isPresent()) {
                user = existingUser.get();
                
                // If user has password set, they must use email/password login
                if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Password already set. Please login with email and password.");
                    errorResponse.put("hasPassword", true);
                    errorResponse.put("email", user.getEmail());
                    return ResponseEntity.status(400).body(errorResponse);
                }
                
                // Update Google ID if not set
                if (user.getGoogleId() == null || user.getGoogleId().isEmpty()) {
                    user.setGoogleId(googleId);
                }
                // Update name if provided and different
                if (name != null && !name.isEmpty() && (user.getName() == null || user.getName().isEmpty())) {
                    user.setName(name);
                }
                // For updates, we can use save() since we're not generating a new ID
                user = userRepository.save(user);
            } else {
                // Use native SQL to avoid getGeneratedKeys() issue with SQLite
                String userName = name != null && !name.isEmpty() ? name : "User";
                String sql = "INSERT INTO users (email, name, google_id, role, created_at) " +
                            "VALUES (?, ?, ?, ?, ?)";
                
                Query query = entityManager.createNativeQuery(sql);
                query.setParameter(1, email);
                query.setParameter(2, userName);
                query.setParameter(3, googleId);
                query.setParameter(4, "CUSTOMER");
                query.setParameter(5, java.sql.Timestamp.valueOf(LocalDateTime.now()));
                
                query.executeUpdate();
                
                // Fetch the newly created user
                user = userRepository.findByEmail(email).orElseThrow(() -> 
                    new RuntimeException("Failed to retrieve created user"));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwtUtil.generateToken(user.getEmail(), user.getRole().name()));
            response.put("user", user);
            response.put("hasPassword", user.getPassword() != null && !user.getPassword().isEmpty());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Customer login with email and password
     */
    @PostMapping("/customer/login")
    public ResponseEntity<?> customerLogin(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Email is required"));
            }
            if (password == null || password.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Password is required"));
            }
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty() || userOpt.get().getRole() != User.UserRole.CUSTOMER) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }
            
            User user = userOpt.get();
            
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Password not set. Please login with Google first."));
            }
            
            if (!passwordEncoder.matches(password, user.getPassword())) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwtUtil.generateToken(user.getEmail(), user.getRole().name()));
            response.put("user", user);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Set password for customer (after Google login)
     */
    @PostMapping("/customer/set-password")
    @Transactional
    public ResponseEntity<?> setPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Email is required"));
            }
            if (password == null || password.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Password is required"));
            }
            if (password.length() < 6) {
                return ResponseEntity.status(400).body(Map.of("error", "Password must be at least 6 characters"));
            }
            
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty() || userOpt.get().getRole() != User.UserRole.CUSTOMER) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            
            User user = userOpt.get();
            String encodedPassword = passwordEncoder.encode(password);
            
            // Update password using native SQL
            String sql = "UPDATE users SET password = ? WHERE id = ?";
            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, encodedPassword);
            query.setParameter(2, user.getId());
            query.executeUpdate();
            
            // Fetch updated user
            user = userRepository.findByEmail(email).orElseThrow(() -> 
                new RuntimeException("Failed to retrieve updated user"));
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password set successfully");
            response.put("user", user);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Admin and Delivery Man login with username and password
     * This endpoint allows both ADMIN and DELIVERY_MAN roles to login
     */
    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        
        User user = userOpt.get();
        
        // Allow both ADMIN and DELIVERY_MAN to login through this endpoint
        if (user.getRole() != User.UserRole.ADMIN && user.getRole() != User.UserRole.DELIVERY_MAN) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials. Only admin and delivery man can login here."));
        }
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwtUtil.generateToken(user.getUsername(), user.getRole().name()));
        response.put("user", user);
        
        System.out.println("✅ Login successful: " + username + " (Role: " + user.getRole() + ")");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Send OTP to email for signup/login
     */
    @PostMapping("/customer/send-otp")
    @Transactional
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Email is required"));
            }
            
            // Validate email format
            if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                return ResponseEntity.status(400).body(Map.of("error", "Invalid email format"));
            }
            
            // Generate 6-digit OTP
            Random random = new Random();
            String otpCode = String.format("%06d", random.nextInt(1000000));
            
            // Delete old OTPs for this email using native SQL
            try {
                String deleteSql = "DELETE FROM otps WHERE email = ?";
                Query deleteQuery = entityManager.createNativeQuery(deleteSql);
                deleteQuery.setParameter(1, email);
                deleteQuery.executeUpdate();
            } catch (Exception e) {
                // Table might not exist yet, that's okay - will be created on first insert
                System.out.println("Note: Could not delete old OTPs (table may not exist yet): " + e.getMessage());
            }
            
            // Create new OTP using native SQL (to avoid SQLite getGeneratedKeys issue)
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiresAt = now.plusMinutes(OTP_EXPIRY_MINUTES);
            
            // Use column names as they appear in the database (Hibernate converts camelCase to snake_case)
            String sql = "INSERT INTO otps (email, code, created_at, expires_at, verified) " +
                        "VALUES (?, ?, ?, ?, ?)";
            
            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, email);
            query.setParameter(2, otpCode);
            query.setParameter(3, java.sql.Timestamp.valueOf(now));
            query.setParameter(4, java.sql.Timestamp.valueOf(expiresAt));
            query.setParameter(5, false);
            
            query.executeUpdate();
            
            // Send OTP via email
            try {
                emailService.sendOtpEmail(email, otpCode);
            } catch (Exception e) {
                e.printStackTrace();
                // Log the error but don't fail the request
                // OTP is already saved in database, user can verify it
                System.err.println("Warning: OTP generated but email sending failed: " + e.getMessage());
                // Return success anyway - OTP is in DB and can be verified
                // In production, consider using a queue for email sending
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "OTP sent successfully to your email");
            response.put("email", email);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = "An unexpected error occurred";
            }
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + errorMessage));
        }
    }
    
    /**
     * Verify OTP and login/signup user
     */
    @PostMapping("/customer/verify-otp")
    @Transactional
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String otpCode = request.get("otp");
            String name = request.get("name"); // Optional, for new signups
            
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Email is required"));
            }
            if (otpCode == null || otpCode.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "OTP is required"));
            }
            
            // Find latest unverified OTP for this email
            Optional<Otp> otpOpt = otpRepository.findLatestUnverifiedByEmail(email);
            
            if (otpOpt.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "No OTP found. Please request a new OTP."));
            }
            
            Otp otp = otpOpt.get();
            
            // Check if OTP is expired
            if (otp.isExpired()) {
                return ResponseEntity.status(400).body(Map.of("error", "OTP has expired. Please request a new OTP."));
            }
            
            // Check if OTP is already verified
            if (otp.getVerified()) {
                return ResponseEntity.status(400).body(Map.of("error", "OTP already used. Please request a new OTP."));
            }
            
            // Verify OTP code
            if (!otp.getCode().equals(otpCode)) {
                return ResponseEntity.status(400).body(Map.of("error", "Invalid OTP. Please try again."));
            }
            
            // Mark OTP as verified using native SQL
            String updateSql = "UPDATE otps SET verified = ? WHERE id = ?";
            Query updateQuery = entityManager.createNativeQuery(updateSql);
            updateQuery.setParameter(1, true);
            updateQuery.setParameter(2, otp.getId());
            updateQuery.executeUpdate();
            
            // Check if user exists
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;
            boolean isNewUser = false;
            
            if (existingUser.isPresent()) {
                user = existingUser.get();
                // User exists - check if they have a password
                if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                    // User has password, login directly
                    Map<String, Object> response = new HashMap<>();
                    response.put("token", jwtUtil.generateToken(user.getEmail(), user.getRole().name()));
                    response.put("user", user);
                    response.put("message", "Login successful");
                    response.put("hasPassword", true);
                    return ResponseEntity.ok(response);
                }
                // User exists but no password - need to set password
            } else {
                // New user signup - create user account
                isNewUser = true;
                String userName = name != null && !name.isEmpty() ? name : "User";
                String sql = "INSERT INTO users (email, name, role, created_at) " +
                            "VALUES (?, ?, ?, ?)";
                
                Query query = entityManager.createNativeQuery(sql);
                query.setParameter(1, email);
                query.setParameter(2, userName);
                query.setParameter(3, "CUSTOMER");
                query.setParameter(4, java.sql.Timestamp.valueOf(LocalDateTime.now()));
                
                query.executeUpdate();
                
                // Fetch the newly created user
                user = userRepository.findByEmail(email).orElseThrow(() ->
                    new RuntimeException("Failed to retrieve created user"));
            }
            
            // OTP verified but password not set - return user info for password setup
            Map<String, Object> response = new HashMap<>();
            response.put("user", user);
            response.put("hasPassword", false);
            response.put("message", isNewUser ? "OTP verified. Please set your password." : "OTP verified. Please set your password.");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Get current user profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                System.out.println("❌ No authentication found");
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            System.out.println("🔍 Getting profile for identifier: " + identifier);
            
            // Try to find user by email, username, or Google ID
            Optional<User> userOpt = userRepository.findByEmail(identifier);
            if (userOpt.isEmpty()) {
                System.out.println("   Not found by email, trying username...");
                userOpt = userRepository.findByUsername(identifier);
            }
            if (userOpt.isEmpty()) {
                System.out.println("   Not found by username, trying Google ID...");
                userOpt = userRepository.findByGoogleId(identifier);
            }
            
            if (userOpt.isEmpty()) {
                System.out.println("❌ User not found with identifier: " + identifier);
                return ResponseEntity.status(404).body(Map.of("error", "User not found. Please login again."));
            }
            
            User user = userOpt.get();
            System.out.println("✅ Found user: " + user.getEmail() + " (ID: " + user.getId() + ")");
            
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("email", user.getEmail());
            userMap.put("name", user.getName() != null ? user.getName() : "");
            userMap.put("mobile", user.getMobile() != null ? user.getMobile() : "");
            userMap.put("role", user.getRole() != null ? user.getRole().name() : "CUSTOMER");
            userMap.put("username", user.getUsername() != null ? user.getUsername() : "");
            userMap.put("photoUrl", user.getPhotoUrl() != null ? user.getPhotoUrl() : "");
            userMap.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt() : null);
            
            return ResponseEntity.ok(userMap);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get profile: " + e.getMessage()));
        }
    }
    
    /**
     * Update user profile (name, mobile)
     */
    @PutMapping("/profile")
    @Transactional
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                System.out.println("❌ No authentication found");
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            System.out.println("🔍 Updating profile for identifier: " + identifier);
            
            // Try to find user by email, username, or Google ID
            Optional<User> userOpt = userRepository.findByEmail(identifier);
            if (userOpt.isEmpty()) {
                System.out.println("   Not found by email, trying username...");
                userOpt = userRepository.findByUsername(identifier);
            }
            if (userOpt.isEmpty()) {
                System.out.println("   Not found by username, trying Google ID...");
                userOpt = userRepository.findByGoogleId(identifier);
            }
            
            if (userOpt.isEmpty()) {
                System.out.println("❌ User not found with identifier: " + identifier);
                return ResponseEntity.status(404).body(Map.of("error", "User not found. Please login again."));
            }
            
            User user = userOpt.get();
            System.out.println("✅ Found user: " + user.getEmail() + " (ID: " + user.getId() + ")");
            System.out.println("📋 Current values - Name: " + user.getName() + ", Mobile: " + user.getMobile() + ", Email: " + user.getEmail());
            
            boolean updated = false;
            
            // Update name if provided
            if (request.containsKey("name") && request.get("name") != null && !request.get("name").isEmpty()) {
                String newName = request.get("name").trim();
                if (!newName.equals(user.getName())) {
                    System.out.println("📝 Updating name from '" + user.getName() + "' to '" + newName + "'");
                    user.setName(newName);
                    updated = true;
                } else {
                    System.out.println("ℹ️ Name unchanged: " + newName);
                }
            }
            
            // Update email if provided
            if (request.containsKey("email") && request.get("email") != null && !request.get("email").isEmpty()) {
                String newEmail = request.get("email").trim().toLowerCase();
                if (!newEmail.equals(user.getEmail())) {
                    // Check if email is already taken by another user
                    Optional<User> existingUser = userRepository.findByEmail(newEmail);
                    if (existingUser.isPresent() && !existingUser.get().getId().equals(user.getId())) {
                        System.out.println("❌ Email already taken: " + newEmail);
                        return ResponseEntity.status(400).body(Map.of("error", "Email is already registered to another account"));
                    }
                    System.out.println("📝 Updating email from '" + user.getEmail() + "' to '" + newEmail + "'");
                    user.setEmail(newEmail);
                    updated = true;
                } else {
                    System.out.println("ℹ️ Email unchanged: " + newEmail);
                }
            }
            
            // Update mobile if provided
            if (request.containsKey("mobile") && request.get("mobile") != null && !request.get("mobile").isEmpty()) {
                String newMobile = request.get("mobile").trim();
                if (!newMobile.equals(user.getMobile())) {
                    System.out.println("📝 Updating mobile from '" + user.getMobile() + "' to '" + newMobile + "'");
                    user.setMobile(newMobile);
                    updated = true;
                } else {
                    System.out.println("ℹ️ Mobile unchanged: " + newMobile);
                }
            }
            
            if (updated) {
                // Save using repository - this will handle the transaction properly
                System.out.println("💾 Saving user with Name: " + user.getName() + ", Mobile: " + user.getMobile());
                user = userRepository.save(user);
                userRepository.flush(); // Force flush to ensure immediate write
                System.out.println("✅ User saved successfully");
                
                // Verify by querying database directly
                String verifySql = "SELECT name, mobile FROM users WHERE id = ?";
                Query verifyQuery = entityManager.createNativeQuery(verifySql);
                verifyQuery.setParameter(1, user.getId());
                Object[] dbResult = (Object[]) verifyQuery.getSingleResult();
                String dbName = dbResult[0] != null ? (String) dbResult[0] : null;
                String dbMobile = dbResult[1] != null ? (String) dbResult[1] : null;
                System.out.println("🔍 Database verification - Name: " + dbName + ", Mobile: " + dbMobile);
                
                // Clear entity manager and fetch fresh data to ensure we have the latest
                entityManager.clear();
                user = userRepository.findById(user.getId())
                        .orElseThrow(() -> new RuntimeException("Failed to retrieve updated user"));
                System.out.println("✅ Fetched fresh user data - Name: " + user.getName() + ", Mobile: " + user.getMobile());
                
                // If entity doesn't match DB, use DB values
                if (dbName != null && !dbName.equals(user.getName())) {
                    System.out.println("⚠️ Entity name doesn't match DB, using DB value: " + dbName);
                    user.setName(dbName);
                }
                if (dbMobile != null && !dbMobile.equals(user.getMobile())) {
                    System.out.println("⚠️ Entity mobile doesn't match DB, using DB value: " + dbMobile);
                    user.setMobile(dbMobile);
                }
            } else {
                System.out.println("ℹ️ No changes to save");
            }
            
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("email", user.getEmail());
            userMap.put("name", user.getName() != null ? user.getName() : "");
            userMap.put("mobile", user.getMobile() != null ? user.getMobile() : "");
            userMap.put("role", user.getRole() != null ? user.getRole().name() : "CUSTOMER");
            userMap.put("username", user.getUsername() != null ? user.getUsername() : "");
            userMap.put("photoUrl", user.getPhotoUrl() != null ? user.getPhotoUrl() : "");
            userMap.put("createdAt", user.getCreatedAt());
            
            System.out.println("📤 Returning user data - Name: " + userMap.get("name") + ", Mobile: " + userMap.get("mobile"));
            
            return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "user", userMap
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }
    
    /**
     * Change password
     */
    @PostMapping("/change-password")
    @Transactional
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                System.out.println("❌ No authentication found for password change");
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            System.out.println("🔍 Changing password for identifier: " + identifier);
            
            // Try to find user by email, username, or Google ID (same pattern as updateProfile)
            Optional<User> userOpt = userRepository.findByEmail(identifier);
            if (userOpt.isEmpty()) {
                System.out.println("   Not found by email, trying username...");
                userOpt = userRepository.findByUsername(identifier);
            }
            if (userOpt.isEmpty()) {
                System.out.println("   Not found by username, trying Google ID...");
                userOpt = userRepository.findByGoogleId(identifier);
            }
            
            if (userOpt.isEmpty()) {
                System.out.println("❌ User not found with identifier: " + identifier);
                return ResponseEntity.status(404).body(Map.of("error", "User not found. Please login again."));
            }
            
            User user = userOpt.get();
            System.out.println("✅ Found user: " + user.getEmail() + " (ID: " + user.getId() + ")");
            
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Current password and new password are required"));
            }
            
            if (newPassword.length() < 6) {
                return ResponseEntity.status(400).body(Map.of("error", "New password must be at least 6 characters"));
            }
            
            // Verify current password if user has one
            if (user.getPassword() != null && !user.getPassword().isEmpty()) {
                if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                    System.out.println("❌ Current password is incorrect for user: " + user.getEmail());
                    return ResponseEntity.status(400).body(Map.of("error", "Current password is incorrect"));
                }
            } else {
                // If user doesn't have a password (e.g., Google login), allow setting password without current password
                System.out.println("ℹ️ User has no existing password (likely Google login), allowing password creation");
            }
            
            // Update password
            String encodedPassword = passwordEncoder.encode(newPassword);
            String sql = "UPDATE users SET password = ? WHERE id = ?";
            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, encodedPassword);
            query.setParameter(2, user.getId());
            int updated = query.executeUpdate();
            
            System.out.println("✅ Password updated successfully for user: " + user.getEmail() + " (rows updated: " + updated + ")");
            
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("❌ Error changing password: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Failed to change password: " + e.getMessage()));
        }
    }
    
    /**
     * Upload profile photo
     */
    @PostMapping("/profile/photo")
    @Transactional
    public ResponseEntity<?> uploadProfilePhoto(@RequestParam("photo") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            
            // Find user
            Optional<User> userOpt = userRepository.findByEmail(identifier);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByUsername(identifier);
            }
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByGoogleId(identifier);
            }
            
            User user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
            
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "File is empty"));
            }
            
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.status(400).body(Map.of("error", "File must be an image"));
            }
            
            // Check file size (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.status(400).body(Map.of("error", "Image size should be less than 5MB"));
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = "profile_" + user.getId() + "_" + UUID.randomUUID().toString() + extension;
            
            // Save file
            Path uploadPath = getProfilePhotoUploadPath();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Update user photo URL
            String photoUrl = "/api/auth/profile/photo/" + filename;
            user.setPhotoUrl(photoUrl);
            user = userRepository.save(user);
            userRepository.flush();
            
            // Build response
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("email", user.getEmail());
            userMap.put("name", user.getName() != null ? user.getName() : "");
            userMap.put("mobile", user.getMobile() != null ? user.getMobile() : "");
            userMap.put("role", user.getRole() != null ? user.getRole().name() : "CUSTOMER");
            userMap.put("username", user.getUsername() != null ? user.getUsername() : "");
            userMap.put("photoUrl", user.getPhotoUrl() != null ? user.getPhotoUrl() : "");
            userMap.put("createdAt", user.getCreatedAt());
            
            System.out.println("✅ Profile photo uploaded: " + photoUrl);
            
            return ResponseEntity.ok(Map.of(
                "message", "Profile photo uploaded successfully",
                "user", userMap
            ));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload photo: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload photo: " + e.getMessage()));
        }
    }
    
    /**
     * Serve profile photos
     */
    @GetMapping("/profile/photo/{filename:.+}")
    public ResponseEntity<?> getProfilePhoto(@PathVariable String filename) {
        try {
            Path filePath = getProfilePhotoUploadPath().resolve(filename).normalize();
            java.io.File file = filePath.toFile();
            
            if (!file.exists() || !file.isFile()) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] fileContent = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "image/jpeg";
            }
            
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .body(fileContent);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load photo: " + e.getMessage()));
        }
    }
    
    /**
     * Get user addresses
     */
    @GetMapping("/profile/addresses")
    public ResponseEntity<?> getAddresses() {
        try {
            System.out.println("🔍 Getting addresses for authenticated user");
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                System.out.println("❌ Authentication failed: " + (authentication == null ? "null" : authentication.getName()));
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            System.out.println("🔍 Finding user with identifier: " + identifier);
            
            // Find user
            Optional<User> userOpt = userRepository.findByEmail(identifier);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByUsername(identifier);
            }
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByGoogleId(identifier);
            }
            
            User user = userOpt.orElseThrow(() -> {
                System.out.println("❌ User not found for identifier: " + identifier);
                return new RuntimeException("User not found");
            });
            
            System.out.println("✅ Found user: " + user.getEmail() + " (ID: " + user.getId() + ")");
            System.out.println("🔍 Fetching addresses for user ID: " + user.getId());
            
            List<Address> addresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());
            System.out.println("✅ Found " + addresses.size() + " addresses");
            
            List<Map<String, Object>> addressList = addresses.stream().map(addr -> {
                Map<String, Object> addrMap = new HashMap<>();
                addrMap.put("id", addr.getId());
                addrMap.put("label", addr.getLabel());
                addrMap.put("address", addr.getAddress());
                addrMap.put("city", addr.getCity());
                addrMap.put("state", addr.getState());
                addrMap.put("pincode", addr.getPincode());
                addrMap.put("isDefault", addr.getIsDefault());
                return addrMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(addressList);
        } catch (Exception e) {
            System.out.println("❌ Error getting addresses: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get addresses: " + e.getMessage()));
        }
    }
    
    /**
     * Add new address
     */
    @PostMapping("/profile/addresses")
    @Transactional
    public ResponseEntity<?> addAddress(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔍 Adding new address");
            System.out.println("📝 Request data: " + request);
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                System.out.println("❌ Authentication failed");
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            System.out.println("🔍 Finding user with identifier: " + identifier);
            
            // Find user
            Optional<User> userOpt = userRepository.findByEmail(identifier);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByUsername(identifier);
            }
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByGoogleId(identifier);
            }
            
            User user = userOpt.orElseThrow(() -> {
                System.out.println("❌ User not found for identifier: " + identifier);
                return new RuntimeException("User not found");
            });
            
            System.out.println("✅ Found user: " + user.getEmail() + " (ID: " + user.getId() + ")");
            
            // Validate required fields
            if (request.get("address") == null || request.get("city") == null || 
                request.get("state") == null || request.get("pincode") == null) {
                System.out.println("❌ Missing required fields");
                return ResponseEntity.status(400).body(Map.of("error", "Address, city, state, and pincode are required"));
            }
            
            // If this is set as default, clear other default addresses
            Boolean isDefault = request.get("isDefault") != null && (Boolean) request.get("isDefault");
            System.out.println("📝 Is default: " + isDefault);
            if (isDefault) {
                System.out.println("🔍 Clearing other default addresses");
                addressRepository.clearDefaultAddresses(user.getId());
            }
            
            // Create new address using native SQL to avoid SQLite getGeneratedKeys limitation
            String label = request.get("label") != null ? request.get("label").toString() : "Home";
            String addressStr = request.get("address").toString();
            String city = request.get("city").toString();
            String state = request.get("state").toString();
            String pincode = request.get("pincode").toString();
            int isDefaultInt = isDefault ? 1 : 0;
            
            LocalDateTime now = LocalDateTime.now();
            
            System.out.println("💾 Saving address to database using native SQL");
            String insertSql = "INSERT INTO addresses (user_id, label, address, city, state, pincode, is_default, created_at, updated_at) " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            Query insertQuery = entityManager.createNativeQuery(insertSql);
            insertQuery.setParameter(1, user.getId());
            insertQuery.setParameter(2, label);
            insertQuery.setParameter(3, addressStr);
            insertQuery.setParameter(4, city);
            insertQuery.setParameter(5, state);
            insertQuery.setParameter(6, pincode);
            insertQuery.setParameter(7, isDefaultInt);
            insertQuery.setParameter(8, java.sql.Timestamp.valueOf(now));
            insertQuery.setParameter(9, java.sql.Timestamp.valueOf(now));
            insertQuery.executeUpdate();
            
            // Get the generated ID
            Query idQuery = entityManager.createNativeQuery("SELECT last_insert_rowid()");
            Long addressId = ((Number) idQuery.getSingleResult()).longValue();
            System.out.println("✅ Address saved with ID: " + addressId);
            
            // Clear entity manager cache and fetch the saved address
            entityManager.clear();
            Address savedAddress = addressRepository.findById(addressId)
                    .orElseThrow(() -> new RuntimeException("Failed to retrieve saved address"));
            
            Map<String, Object> addrMap = new HashMap<>();
            addrMap.put("id", savedAddress.getId());
            addrMap.put("label", savedAddress.getLabel());
            addrMap.put("address", savedAddress.getAddress());
            addrMap.put("city", savedAddress.getCity());
            addrMap.put("state", savedAddress.getState());
            addrMap.put("pincode", savedAddress.getPincode());
            addrMap.put("isDefault", savedAddress.getIsDefault());
            
            return ResponseEntity.ok(addrMap);
        } catch (Exception e) {
            System.out.println("❌ Error adding address: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to add address: " + e.getMessage()));
        }
    }
    
    /**
     * Update address
     */
    @PutMapping("/profile/addresses/{id}")
    @Transactional
    public ResponseEntity<?> updateAddress(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            
            // Find user
            Optional<User> userOpt = userRepository.findByEmail(identifier);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByUsername(identifier);
            }
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByGoogleId(identifier);
            }
            
            User user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
            
            // Find address
            Optional<Address> addressOpt = addressRepository.findById(id);
            if (addressOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Address not found"));
            }
            
            Address address = addressOpt.get();
            
            // Verify address belongs to user
            if (!address.getUserId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            
            // Update fields
            if (request.containsKey("label")) {
                address.setLabel(request.get("label").toString());
            }
            if (request.containsKey("address")) {
                address.setAddress(request.get("address").toString());
            }
            if (request.containsKey("city")) {
                address.setCity(request.get("city").toString());
            }
            if (request.containsKey("state")) {
                address.setState(request.get("state").toString());
            }
            if (request.containsKey("pincode")) {
                address.setPincode(request.get("pincode").toString());
            }
            if (request.containsKey("isDefault")) {
                Boolean isDefault = (Boolean) request.get("isDefault");
                if (isDefault) {
                    addressRepository.clearDefaultAddresses(user.getId());
                }
                address.setIsDefault(isDefault);
            }
            
            // Use native SQL update to avoid SQLite issues
            String updateSql = "UPDATE addresses SET label = ?, address = ?, city = ?, state = ?, pincode = ?, is_default = ?, updated_at = ? WHERE id = ?";
            Query updateQuery = entityManager.createNativeQuery(updateSql);
            updateQuery.setParameter(1, address.getLabel());
            updateQuery.setParameter(2, address.getAddress());
            updateQuery.setParameter(3, address.getCity());
            updateQuery.setParameter(4, address.getState());
            updateQuery.setParameter(5, address.getPincode());
            updateQuery.setParameter(6, address.getIsDefault() ? 1 : 0);
            updateQuery.setParameter(7, java.sql.Timestamp.valueOf(LocalDateTime.now()));
            updateQuery.setParameter(8, address.getId());
            updateQuery.executeUpdate();
            
            // Refresh the entity
            entityManager.refresh(address);
            
            Map<String, Object> addrMap = new HashMap<>();
            addrMap.put("id", address.getId());
            addrMap.put("label", address.getLabel());
            addrMap.put("address", address.getAddress());
            addrMap.put("city", address.getCity());
            addrMap.put("state", address.getState());
            addrMap.put("pincode", address.getPincode());
            addrMap.put("isDefault", address.getIsDefault());
            
            return ResponseEntity.ok(addrMap);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update address: " + e.getMessage()));
        }
    }
    
    /**
     * Delete address
     */
    @DeleteMapping("/profile/addresses/{id}")
    @Transactional
    public ResponseEntity<?> deleteAddress(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            
            // Find user
            Optional<User> userOpt = userRepository.findByEmail(identifier);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByUsername(identifier);
            }
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByGoogleId(identifier);
            }
            
            User user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
            
            // Find address
            Optional<Address> addressOpt = addressRepository.findById(id);
            if (addressOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Address not found"));
            }
            
            Address address = addressOpt.get();
            
            // Verify address belongs to user
            if (!address.getUserId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            
            addressRepository.delete(address);
            
            return ResponseEntity.ok(Map.of("message", "Address deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete address: " + e.getMessage()));
        }
    }
    
    /**
     * Set default address
     */
    @PostMapping("/profile/addresses/{id}/set-default")
    @Transactional
    public ResponseEntity<?> setDefaultAddress(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            
            // Find user
            Optional<User> userOpt = userRepository.findByEmail(identifier);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByUsername(identifier);
            }
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByGoogleId(identifier);
            }
            
            User user = userOpt.orElseThrow(() -> new RuntimeException("User not found"));
            
            // Find address
            Optional<Address> addressOpt = addressRepository.findById(id);
            if (addressOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Address not found"));
            }
            
            Address address = addressOpt.get();
            
            // Verify address belongs to user
            if (!address.getUserId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
            }
            
            // Clear other default addresses
            addressRepository.clearDefaultAddresses(user.getId());
            
            // Set this as default
            address.setIsDefault(true);
            address = addressRepository.save(address);
            addressRepository.flush();
            
            Map<String, Object> addrMap = new HashMap<>();
            addrMap.put("id", address.getId());
            addrMap.put("label", address.getLabel());
            addrMap.put("address", address.getAddress());
            addrMap.put("city", address.getCity());
            addrMap.put("state", address.getState());
            addrMap.put("pincode", address.getPincode());
            addrMap.put("isDefault", address.getIsDefault());
            
            return ResponseEntity.ok(addrMap);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to set default address: " + e.getMessage()));
        }
    }
    
    /**
     * Admin only: Create delivery man account
     * Only admins can create delivery man users with username and password
     * Accepts multipart form data for proof documents
     */
    @PostMapping(value = "/admin/create-delivery-man", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> createDeliveryMan(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam("email") String email,
            @RequestParam("name") String name,
            @RequestParam(value = "mobile", required = false) String mobile,
            @RequestParam(value = "aadhaarCard", required = false) MultipartFile aadhaarCard,
            @RequestParam(value = "panCard", required = false) MultipartFile panCard,
            @RequestParam(value = "drivingLicense", required = false) MultipartFile drivingLicense) {
        try {
            // Verify current user is admin
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of(
                    "error", "Unauthorized",
                    "message", "Authentication required"
                ));
            }
            
            String currentUserEmail = authentication.getName();
            
            if (currentUserEmail == null || currentUserEmail.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of(
                    "error", "Unauthorized",
                    "message", "User not found in authentication context"
                ));
            }
            
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElse(userRepository.findByUsername(currentUserEmail)
                            .orElse(null));
            
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "error", "Unauthorized",
                    "message", "User not found"
                ));
            }
            
            if (currentUser.getRole() != User.UserRole.ADMIN) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Access denied",
                    "message", "Only admins can create delivery man accounts"
                ));
            }
            
            // Validate required fields
            if (username == null || username.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Username is required"));
            }
            if (password == null || password.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Password is required"));
            }
            if (password.length() < 6) {
                return ResponseEntity.status(400).body(Map.of("error", "Password must be at least 6 characters"));
            }
            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Email is required"));
            }
            if (name == null || name.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Name is required"));
            }
            
            // Check if username already exists
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.status(400).body(Map.of("error", "Username already exists"));
            }
            
            // Check if email already exists
            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.status(400).body(Map.of("error", "Email already exists"));
            }
            
            // Encode password
            String encodedPassword = passwordEncoder.encode(password);
            
            // Create delivery man user using helper method
            User deliveryMan = createDeliveryManUser(username, email, encodedPassword, name, mobile);
            
            // Upload proof documents if provided
            String aadhaarCardUrl = null;
            String panCardUrl = null;
            String drivingLicenseUrl = null;
            
            if (aadhaarCard != null && !aadhaarCard.isEmpty()) {
                aadhaarCardUrl = uploadProofDocument(aadhaarCard, deliveryMan.getId(), "aadhaar");
            }
            if (panCard != null && !panCard.isEmpty()) {
                panCardUrl = uploadProofDocument(panCard, deliveryMan.getId(), "pan");
            }
            if (drivingLicense != null && !drivingLicense.isEmpty()) {
                drivingLicenseUrl = uploadProofDocument(drivingLicense, deliveryMan.getId(), "driving_license");
            }
            
            // Update user with proof document URLs
            if (aadhaarCardUrl != null || panCardUrl != null || drivingLicenseUrl != null) {
                String updateSql = "UPDATE users SET ";
                List<String> updates = new ArrayList<>();
                List<Object> params = new ArrayList<>();
                
                if (aadhaarCardUrl != null) {
                    updates.add("aadhaar_card_url = ?");
                    params.add(aadhaarCardUrl);
                }
                if (panCardUrl != null) {
                    updates.add("pan_card_url = ?");
                    params.add(panCardUrl);
                }
                if (drivingLicenseUrl != null) {
                    updates.add("driving_license_url = ?");
                    params.add(drivingLicenseUrl);
                }
                
                updateSql += String.join(", ", updates) + " WHERE id = ?";
                params.add(deliveryMan.getId());
                
                jdbcTemplate.update(updateSql, params.toArray());
            }
            
            System.out.println("✅ Delivery man created by admin: " + currentUser.getEmail());
            System.out.println("   Delivery man username: " + username);
            System.out.println("   Delivery man email: " + email);
            
            // Fetch updated user with proof documents
            deliveryMan = userRepository.findById(deliveryMan.getId()).orElse(deliveryMan);
            
            // Build response using a Map to avoid Hibernate serialization issues
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", deliveryMan.getId());
            userMap.put("username", deliveryMan.getUsername());
            userMap.put("email", deliveryMan.getEmail());
            userMap.put("name", deliveryMan.getName());
            userMap.put("mobile", deliveryMan.getMobile() != null ? deliveryMan.getMobile() : "");
            userMap.put("role", deliveryMan.getRole() != null ? deliveryMan.getRole().name() : "DELIVERY_MAN");
            userMap.put("aadhaarCardUrl", deliveryMan.getAadhaarCardUrl());
            userMap.put("panCardUrl", deliveryMan.getPanCardUrl());
            userMap.put("drivingLicenseUrl", deliveryMan.getDrivingLicenseUrl());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Delivery man account created successfully");
            response.put("user", userMap);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            String errorMessage = e.getMessage();
            String causeMessage = "";
            Throwable cause = e.getCause();
            int depth = 0;
            while (cause != null && depth < 3) {
                causeMessage += (causeMessage.isEmpty() ? "" : " -> ") + cause.getMessage();
                cause = cause.getCause();
                depth++;
            }
            
            String fullErrorMessage = errorMessage;
            if (!causeMessage.isEmpty()) {
                fullErrorMessage += " | Cause: " + causeMessage;
            }
            
            System.err.println("❌ Error creating delivery man: " + fullErrorMessage);
            System.err.println("   Exception type: " + e.getClass().getName());
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error",
                "message", fullErrorMessage != null ? fullErrorMessage : "Unknown error",
                "exceptionType", e.getClass().getSimpleName(),
                "hint", "Check backend console for full stack trace. If you see CHECK constraint error, restart the backend server to run the migration."
            ));
        }
    }
    
    /**
     * Helper method to create delivery man user
     * Uses native SQL to avoid SQLite getGeneratedKeys() issue
     * Note: This method must be called from within a transaction
     */
    private User createDeliveryManUser(String username, String email, String encodedPassword, String name, String mobile) {
        System.out.println("🔧 Creating delivery man using JdbcTemplate (bypassing Hibernate)...");
        System.out.println("   Username: " + username);
        System.out.println("   Email: " + email);
        
        // Use JdbcTemplate to bypass Hibernate entirely and avoid getGeneratedKeys() issue
        String sql = "INSERT INTO users (username, email, password, name, mobile, role, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        System.out.println("   Executing SQL: " + sql);
        
        // Execute using JdbcTemplate (bypasses Hibernate)
        int rowsAffected = jdbcTemplate.update(sql,
            username,
            email,
            encodedPassword,
            name,
            mobile != null && !mobile.isEmpty() ? mobile : null,
            "DELIVERY_MAN",
            java.sql.Timestamp.valueOf(LocalDateTime.now())
        );
        
        System.out.println("   ✅ Insert completed. Rows affected: " + rowsAffected);
        
        if (rowsAffected == 0) {
            throw new RuntimeException("Failed to insert delivery man user - no rows affected");
        }
        
        // Clear the persistence context to ensure we fetch fresh data
        entityManager.clear();
        System.out.println("   🔍 Fetching created user using JdbcTemplate native query...");
        
        // Fetch the created user by username using native query to avoid Hibernate entity management
        String selectSql = "SELECT id, username, email, password, name, mobile, role, google_id, created_at FROM users WHERE username = ?";
        
        try {
            List<Object[]> results = jdbcTemplate.query(selectSql, (rs, rowNum) -> {
                return new Object[]{
                    rs.getLong("id"),
                    rs.getString("username"),
                    rs.getString("email"),
                    rs.getString("password"),
                    rs.getString("name"),
                    rs.getString("mobile"),
                    rs.getString("role"),
                    rs.getString("google_id"),
                    rs.getTimestamp("created_at")
                };
            }, username);
            
            if (results.isEmpty()) {
                System.out.println("   ⚠️  Native query returned no results, trying fallback...");
                // Fallback to repository if native query doesn't work
                Optional<User> createdUser = userRepository.findByUsername(username);
                if (createdUser.isPresent()) {
                    User user = createdUser.get();
                    entityManager.detach(user);
                    System.out.println("   ✅ User found via repository fallback");
                    return user;
                }
                throw new RuntimeException("Failed to retrieve created delivery man. Username: " + username);
            }
            
            System.out.println("   ✅ User found via native query. Building User object...");
            
            // Build User object from native query results
            Object[] row = results.get(0);
            User user = new User();
            user.setId((Long) row[0]);
            user.setUsername((String) row[1]);
            user.setEmail((String) row[2]);
            user.setPassword((String) row[3]);
            user.setName((String) row[4]);
            user.setMobile((String) row[5]);
            user.setRole(User.UserRole.valueOf((String) row[6]));
            user.setGoogleId((String) row[7]);
            if (row[8] != null) {
                user.setCreatedAt(((java.sql.Timestamp) row[8]).toLocalDateTime());
            }
            
            System.out.println("   ✅ Delivery man user created successfully (not managed by Hibernate)");
            
            // Entity is not managed by Hibernate, so no need to detach
            return user;
        } catch (Exception e) {
            System.out.println("   ❌ Error in native query: " + e.getMessage());
            e.printStackTrace();
            // Fallback to repository if native query fails
            Optional<User> createdUser = userRepository.findByUsername(username);
            if (createdUser.isPresent()) {
                User user = createdUser.get();
                entityManager.detach(user);
                System.out.println("   ✅ User found via repository fallback after error");
                return user;
            }
            throw new RuntimeException("Failed to retrieve created delivery man. Username: " + username + ". Error: " + e.getMessage(), e);
        }
    }
    
    /**
     * Admin only: Get all delivery men
     */
    @GetMapping("/admin/delivery-men")
    public ResponseEntity<?> getAllDeliveryMen() {
        try {
            // Verify current user is admin
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElse(userRepository.findByUsername(currentUserEmail)
                            .orElseThrow(() -> new RuntimeException("User not found")));
            
            if (currentUser.getRole() != User.UserRole.ADMIN) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Access denied",
                    "message", "Only admins can view delivery men"
                ));
            }
            
            List<User> deliveryMen = userRepository.findAll().stream()
                    .filter(user -> user.getRole() == User.UserRole.DELIVERY_MAN)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(deliveryMen);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch delivery men: " + e.getMessage()));
        }
    }
    
    /**
     * Admin only: Update delivery man account
     */
    @PutMapping("/admin/delivery-men/{id}")
    @Transactional
    public ResponseEntity<?> updateDeliveryMan(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            // Verify current user is admin
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElse(userRepository.findByUsername(currentUserEmail)
                            .orElseThrow(() -> new RuntimeException("User not found")));
            
            if (currentUser.getRole() != User.UserRole.ADMIN) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Access denied",
                    "message", "Only admins can update delivery man accounts"
                ));
            }
            
            User deliveryMan = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Delivery man not found"));
            
            if (deliveryMan.getRole() != User.UserRole.DELIVERY_MAN) {
                return ResponseEntity.status(400).body(Map.of("error", "User is not a delivery man"));
            }
            
            // Update fields if provided
            if (request.containsKey("name") && request.get("name") != null) {
                String sql = "UPDATE users SET name = ? WHERE id = ?";
                Query query = entityManager.createNativeQuery(sql);
                query.setParameter(1, request.get("name"));
                query.setParameter(2, id);
                query.executeUpdate();
            }
            
            if (request.containsKey("mobile") && request.get("mobile") != null) {
                String sql = "UPDATE users SET mobile = ? WHERE id = ?";
                Query query = entityManager.createNativeQuery(sql);
                query.setParameter(1, request.get("mobile"));
                query.setParameter(2, id);
                query.executeUpdate();
            }
            
            if (request.containsKey("email") && request.get("email") != null) {
                String sql = "UPDATE users SET email = ? WHERE id = ?";
                Query query = entityManager.createNativeQuery(sql);
                query.setParameter(1, request.get("email"));
                query.setParameter(2, id);
                query.executeUpdate();
            }
            
            if (request.containsKey("password") && request.get("password") != null) {
                String newPassword = request.get("password");
                if (newPassword.length() < 6) {
                    return ResponseEntity.status(400).body(Map.of("error", "Password must be at least 6 characters"));
                }
                String encodedPassword = passwordEncoder.encode(newPassword);
                String sql = "UPDATE users SET password = ? WHERE id = ?";
                Query query = entityManager.createNativeQuery(sql);
                query.setParameter(1, encodedPassword);
                query.setParameter(2, id);
                query.executeUpdate();
            }
            
            // Fetch updated user
            deliveryMan = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Failed to retrieve updated delivery man"));
            
            return ResponseEntity.ok(Map.of(
                "message", "Delivery man updated successfully",
                "user", deliveryMan
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Admin only: Delete delivery man account
     */
    @DeleteMapping("/admin/delivery-men/{id}")
    @Transactional
    public ResponseEntity<?> deleteDeliveryMan(@PathVariable Long id) {
        try {
            // Verify current user is admin
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElse(userRepository.findByUsername(currentUserEmail)
                            .orElseThrow(() -> new RuntimeException("User not found")));
            
            if (currentUser.getRole() != User.UserRole.ADMIN) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Access denied",
                    "message", "Only admins can delete delivery man accounts"
                ));
            }
            
            User deliveryMan = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Delivery man not found"));
            
            if (deliveryMan.getRole() != User.UserRole.DELIVERY_MAN) {
                return ResponseEntity.status(400).body(Map.of("error", "User is not a delivery man"));
            }
            
            // Check if delivery man has assigned orders
            // You might want to prevent deletion if there are active orders
            // For now, we'll allow deletion
            
            userRepository.delete(deliveryMan);
            
            return ResponseEntity.ok(Map.of("message", "Delivery man deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Admin only: Get all users (customers)
     */
    @GetMapping("/admin/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            // Verify current user is admin
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();
            
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElse(userRepository.findByUsername(currentUserEmail)
                            .orElseThrow(() -> new RuntimeException("User not found")));
            
            if (currentUser.getRole() != User.UserRole.ADMIN) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Access denied",
                    "message", "Only admins can view users"
                ));
            }
            
            List<User> users = userRepository.findAll().stream()
                    .filter(user -> user.getRole() == User.UserRole.CUSTOMER)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch users: " + e.getMessage()));
        }
    }
    
    /**
     * Serve proof documents
     */
    @GetMapping("/admin/proof-documents/{filename:.+}")
    public ResponseEntity<?> getProofDocument(@PathVariable String filename) {
        try {
            Path filePath = getProofDocumentsUploadPath().resolve(filename).normalize();
            java.io.File file = filePath.toFile();
            
            if (!file.exists() || !file.isFile()) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] fileContent = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "image/jpeg";
            }
            
            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .body(fileContent);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load document: " + e.getMessage()));
        }
    }
}

