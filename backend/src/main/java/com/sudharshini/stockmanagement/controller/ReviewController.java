package com.sudharshini.stockmanagement.controller;

import com.sudharshini.stockmanagement.entity.Product;
import com.sudharshini.stockmanagement.entity.Review;
import com.sudharshini.stockmanagement.entity.User;
import com.sudharshini.stockmanagement.repository.ProductRepository;
import com.sudharshini.stockmanagement.repository.ReviewRepository;
import com.sudharshini.stockmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;
    
    /**
     * Get all reviews for a product
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getProductReviews(@PathVariable Long productId) {
        try {
            List<Review> reviews = reviewRepository.findByProduct_IdOrderByCreatedAtDesc(productId);
            
            List<Map<String, Object>> reviewList = reviews.stream().map(review -> {
                Map<String, Object> reviewMap = new HashMap<>();
                reviewMap.put("id", review.getId());
                reviewMap.put("rating", review.getRating());
                reviewMap.put("comment", review.getComment());
                reviewMap.put("createdAt", review.getCreatedAt());
                reviewMap.put("updatedAt", review.getUpdatedAt());
                
                // User info (without sensitive data)
                if (review.getUser() != null) {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", review.getUser().getId());
                    userMap.put("name", review.getUser().getName());
                    userMap.put("email", review.getUser().getEmail());
                    reviewMap.put("user", userMap);
                }
                
                return reviewMap;
            }).collect(Collectors.toList());
            
            // Get average rating and review count
            Double averageRating = reviewRepository.getAverageRatingByProductId(productId);
            Long reviewCount = reviewRepository.getReviewCountByProductId(productId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("reviews", reviewList);
            response.put("averageRating", averageRating != null ? averageRating : 0.0);
            response.put("reviewCount", reviewCount != null ? reviewCount : 0);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get reviews: " + e.getMessage()));
        }
    }
    
    /**
     * Get user's reviews
     */
    @GetMapping("/user/me")
    public ResponseEntity<?> getMyReviews() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElse(userRepository.findByUsername(email)
                            .orElse(userRepository.findByGoogleId(email)
                                    .orElseThrow(() -> new RuntimeException("User not found"))));
            
            List<Review> reviews = reviewRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
            
            List<Map<String, Object>> reviewList = reviews.stream().map(review -> {
                Map<String, Object> reviewMap = new HashMap<>();
                reviewMap.put("id", review.getId());
                reviewMap.put("rating", review.getRating());
                reviewMap.put("comment", review.getComment());
                reviewMap.put("createdAt", review.getCreatedAt());
                reviewMap.put("updatedAt", review.getUpdatedAt());
                
                // Product info
                if (review.getProduct() != null) {
                    Map<String, Object> productMap = new HashMap<>();
                    productMap.put("id", review.getProduct().getId());
                    productMap.put("name", review.getProduct().getName());
                    productMap.put("imageUrl", review.getProduct().getImageUrl());
                    reviewMap.put("product", productMap);
                }
                
                return reviewMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(reviewList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get reviews: " + e.getMessage()));
        }
    }
    
    /**
     * Add or update a review
     */
    @PostMapping("/product/{productId}")
    @Transactional
    public ResponseEntity<?> addReview(@PathVariable Long productId, @RequestBody Map<String, Object> request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            System.out.println("🔍 ReviewController - Authentication check:");
            System.out.println("   Authentication object: " + (authentication != null ? "exists" : "null"));
            System.out.println("   Authentication name: " + (authentication != null ? authentication.getName() : "null"));
            System.out.println("   Is anonymous: " + (authentication != null && "anonymousUser".equals(authentication.getName())));
            
            if (authentication == null || authentication.getName() == null || 
                authentication.getName().equals("anonymousUser")) {
                System.out.println("❌ No authentication found for review");
                System.out.println("   Request path: /api/reviews/product/" + productId);
                System.out.println("   This usually means the JWT token was not validated or is missing");
                return ResponseEntity.status(401).body(Map.of(
                    "error", "Authentication required. Please login again.",
                    "details", "Your session may have expired. Please refresh the page and login."
                ));
            }
            
            String identifier = authentication.getName();
            System.out.println("🔍 Adding review for product " + productId + " by user: " + identifier);
            
            // Try to find user by email, username, or Google ID (same pattern as other endpoints)
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
            
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> {
                        System.out.println("❌ Product not found: " + productId);
                        return new RuntimeException("Product not found");
                    });
            
            System.out.println("✅ Found product: " + product.getName() + " (ID: " + product.getId() + ")");
            
            // Handle rating - it might come as Integer or Number
            Object ratingObj = request.get("rating");
            Integer rating = null;
            if (ratingObj instanceof Integer) {
                rating = (Integer) ratingObj;
            } else if (ratingObj instanceof Number) {
                rating = ((Number) ratingObj).intValue();
            }
            
            // Handle comment - it might be null or empty
            Object commentObj = request.get("comment");
            String comment = null;
            if (commentObj != null) {
                if (commentObj instanceof String) {
                    comment = ((String) commentObj).trim();
                } else {
                    comment = commentObj.toString().trim();
                }
            }
            
            // Validate comment is not empty
            if (comment == null || comment.isEmpty()) {
                System.out.println("❌ Comment is empty or null");
                return ResponseEntity.status(400).body(Map.of("error", "Comment is required and cannot be empty"));
            }
            
            System.out.println("📝 Review data - Rating: " + rating + ", Comment length: " + (comment != null ? comment.length() : 0));
            
            if (rating == null || rating < 1 || rating > 5) {
                return ResponseEntity.status(400).body(Map.of("error", "Rating must be between 1 and 5"));
            }
            
            // Check if user already reviewed this product
            Optional<Review> existingReview = reviewRepository.findByProduct_IdAndUser_Id(productId, user.getId());
            
            Review review;
            if (existingReview.isPresent()) {
                // Update existing review
                System.out.println("📝 Updating existing review");
                review = existingReview.get();
                review.setRating(rating);
                review.setComment(comment);
            } else {
                // Create new review
                System.out.println("✨ Creating new review");
                review = new Review();
                review.setProduct(product);
                review.setUser(user);
                review.setRating(rating);
                review.setComment(comment);
            }
            
            System.out.println("💾 Saving review...");
            System.out.println("   Review details - Product ID: " + product.getId() + ", User ID: " + user.getId() + ", Rating: " + rating + ", Comment: " + (comment != null ? comment.substring(0, Math.min(50, comment.length())) : "null"));
            
            try {
                // Use native SQL to avoid SQLite getGeneratedKeys() issue
                if (existingReview.isEmpty()) {
                    // Insert new review
                    String insertSql = "INSERT INTO reviews (product_id, user_id, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)";
                    jakarta.persistence.Query insertQuery = entityManager.createNativeQuery(insertSql);
                    insertQuery.setParameter(1, product.getId());
                    insertQuery.setParameter(2, user.getId());
                    insertQuery.setParameter(3, rating);
                    insertQuery.setParameter(4, comment);
                    java.sql.Timestamp now = java.sql.Timestamp.valueOf(java.time.LocalDateTime.now());
                    insertQuery.setParameter(5, now);
                    insertQuery.setParameter(6, now);
                    insertQuery.executeUpdate();
                    
                    // Get the generated ID using last_insert_rowid()
                    jakarta.persistence.Query idQuery = entityManager.createNativeQuery("SELECT last_insert_rowid()");
                    Object idResult = idQuery.getSingleResult();
                    Long generatedId = ((Number) idResult).longValue();
                    
                    // Fetch the saved review
                    review = reviewRepository.findById(generatedId)
                            .orElseThrow(() -> new RuntimeException("Failed to retrieve saved review"));
                } else {
                    // Update existing review
                    review = reviewRepository.save(review);
                    reviewRepository.flush();
                }
                System.out.println("✅ Review saved successfully (ID: " + review.getId() + ")");
            } catch (Exception saveException) {
                System.out.println("❌ Error saving review to database: " + saveException.getClass().getName());
                System.out.println("   Error message: " + saveException.getMessage());
                saveException.printStackTrace();
                throw new RuntimeException("Failed to save review: " + saveException.getMessage(), saveException);
            }
            
            Map<String, Object> reviewMap = new HashMap<>();
            reviewMap.put("id", review.getId());
            reviewMap.put("rating", review.getRating());
            reviewMap.put("comment", review.getComment());
            reviewMap.put("createdAt", review.getCreatedAt());
            reviewMap.put("updatedAt", review.getUpdatedAt());
            
            Map<String, Object> userMap = new HashMap<>();
            userMap.put("id", user.getId());
            userMap.put("name", user.getName());
            userMap.put("email", user.getEmail());
            reviewMap.put("user", userMap);
            
            return ResponseEntity.ok(reviewMap);
        } catch (RuntimeException e) {
            System.out.println("❌ RuntimeException in addReview: " + e.getMessage());
            System.out.println("   Exception class: " + e.getClass().getName());
            if (e.getCause() != null) {
                System.out.println("   Caused by: " + e.getCause().getClass().getName() + " - " + e.getCause().getMessage());
            }
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to save review",
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            System.out.println("❌ Exception in addReview: " + e.getMessage());
            System.out.println("   Exception class: " + e.getClass().getName());
            if (e.getCause() != null) {
                System.out.println("   Caused by: " + e.getCause().getClass().getName() + " - " + e.getCause().getMessage());
            }
            e.printStackTrace();
            String errorMessage = "Failed to add review: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " (Caused by: " + e.getCause().getMessage() + ")";
            }
            return ResponseEntity.status(500).body(Map.of("error", errorMessage));
        }
    }
    
    /**
     * Delete a review
     */
    @DeleteMapping("/{reviewId}")
    @Transactional
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElse(userRepository.findByUsername(email)
                            .orElse(userRepository.findByGoogleId(email)
                                    .orElseThrow(() -> new RuntimeException("User not found"))));
            
            Review review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new RuntimeException("Review not found"));
            
            // Check if user owns this review
            if (!review.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "You can only delete your own reviews"));
            }
            
            reviewRepository.delete(review);
            
            return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete review: " + e.getMessage()));
        }
    }
}
