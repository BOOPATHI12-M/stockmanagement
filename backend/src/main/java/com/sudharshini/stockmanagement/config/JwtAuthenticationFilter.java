package com.sudharshini.stockmanagement.config;

import com.sudharshini.stockmanagement.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * JWT Authentication Filter
 * Validates JWT tokens and sets authentication context
 * 
 * Flow:
 * 1. Check if request is for a public endpoint (no JWT required)
 * 2. If public endpoint, skip JWT validation and continue
 * 3. If protected endpoint, check for Authorization header with JWT token
 * 4. If token present and valid, set authentication in security context
 * 5. Continue to next filter
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        System.out.println("🔍 JWT Filter - Processing request: " + method + " " + path);
        
        // ============================================
        // STEP 1: Check if this is a PUBLIC endpoint
        // ============================================
        
        // Skip JWT validation for OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(method)) {
            System.out.println("✅ Skipping JWT validation for OPTIONS request");
            chain.doFilter(request, response);
            return;
        }
        
        // Skip JWT validation for public product endpoints (GET only)
        if (path.startsWith("/api/products") && "GET".equalsIgnoreCase(method)) {
            System.out.println("✅ Skipping JWT validation for public GET /api/products");
            chain.doFilter(request, response);
            return;
        }
        
        // Skip JWT validation for public auth endpoints (admin login)
        if (path.equals("/api/auth/admin/login")) {
            System.out.println("✅ Skipping JWT validation for /api/auth/admin/login");
            chain.doFilter(request, response);
            return;
        }
        
        // Skip JWT validation for public auth endpoints, but NOT for profile endpoints
        if (path.startsWith("/api/auth/") && !path.startsWith("/api/auth/admin/") 
            && !path.equals("/api/auth/profile") && !path.equals("/api/auth/change-password")
            && !path.equals("/api/auth/profile/photo") && !path.startsWith("/api/auth/profile/photo/")
            && !path.equals("/api/auth/profile/addresses") && !path.startsWith("/api/auth/profile/addresses/")) {
            System.out.println("✅ Skipping JWT validation for public auth endpoint");
            chain.doFilter(request, response);
            return;
        }
        
        // Allow public access to view product reviews (GET only)
        if (path.startsWith("/api/reviews/product/") && "GET".equalsIgnoreCase(method)) {
            System.out.println("✅ Skipping JWT validation for public GET /api/reviews/product");
            chain.doFilter(request, response);
            return;
        }
        
        // Skip JWT validation for public tracking endpoints
        if (path.matches("/api/orders/[^/]+/tracking") || path.matches("/api/orders/[^/]+/location-tracking")) {
            System.out.println("✅ Skipping JWT validation for public tracking endpoint");
            chain.doFilter(request, response);
            return;
        }
        
        // Skip JWT validation for profile photo serving (public access, GET only)
        if (path.startsWith("/api/auth/profile/photo/") && "GET".equalsIgnoreCase(method)) {
            System.out.println("✅ Skipping JWT validation for public GET profile photo");
            chain.doFilter(request, response);
            return;
        }
        
        // ============================================
        // STEP 2: This is a PROTECTED endpoint
        // Try to extract and validate JWT token
        // ============================================
        
        final String authorizationHeader = request.getHeader("Authorization");
        
        String username = null;
        String jwt = null;
        String role = null;
        
        // Check if Authorization header exists and starts with "Bearer "
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
                role = jwtUtil.extractRole(jwt);
                System.out.println("🔑 JWT Filter - Extracted username: " + username + ", role: " + role);
            } catch (Exception e) {
                System.out.println("❌ JWT token extraction failed for path: " + path);
                System.out.println("   Error: " + e.getMessage());
                logger.error("JWT token validation failed", e);
            }
        } else {
            System.out.println("⚠️ No Authorization header found for protected path: " + path);
        }
        
        // ============================================
        // STEP 3: Validate JWT and set authentication
        // ============================================
        
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            boolean isValid = jwtUtil.validateToken(jwt, username);
            System.out.println("🔍 JWT validation result for " + username + ": " + isValid);
            
            if (isValid) {
                // Ensure role is not null, default to empty string if null
                String userRole = (role != null && !role.isEmpty()) ? role : "";
                
                if (userRole.isEmpty()) {
                    System.out.println("⚠️ Warning: No role found in token for user: " + username);
                } else {
                    System.out.println("✅ Role extracted from token: " + userRole);
                }
                
                // Create authority with ROLE_ prefix (Spring Security convention)
                String authority = "ROLE_" + userRole;
                System.out.println("🔐 Creating authority: " + authority);
                
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    username, null, Collections.singletonList(new SimpleGrantedAuthority(authority))
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                
                System.out.println("✅ Authentication set for user: " + username + " with authority: " + authority);
                System.out.println("📋 All authorities: " + authToken.getAuthorities());
            } else {
                System.out.println("❌ Token validation failed for user: " + username);
            }
        } else if (username == null) {
            System.out.println("⚠️ No valid token found for protected path: " + path);
        }
        
        // ============================================
        // STEP 4: Continue to next filter in chain
        // ============================================
        
        chain.doFilter(request, response);
    }
}

