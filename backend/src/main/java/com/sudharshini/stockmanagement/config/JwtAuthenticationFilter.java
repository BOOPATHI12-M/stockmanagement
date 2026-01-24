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
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        
        // Skip JWT validation for public auth endpoints and OPTIONS requests
        // But allow admin auth endpoints to go through JWT validation
        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        
        // Skip JWT validation for public auth endpoints (including admin login)
        // Check for admin login first (more specific)
        if (path.equals("/api/auth/admin/login")) {
            chain.doFilter(request, response);
            return;
        }
        // Skip JWT validation for public auth endpoints, but NOT for profile endpoints
        // Profile endpoints require authentication
        if (path.startsWith("/api/auth/") && !path.startsWith("/api/auth/admin/") 
            && !path.equals("/api/auth/profile") && !path.equals("/api/auth/change-password")
            && !path.equals("/api/auth/profile/photo") && !path.startsWith("/api/auth/profile/photo/")
            && !path.equals("/api/auth/profile/addresses") && !path.startsWith("/api/auth/profile/addresses/")) {
            chain.doFilter(request, response);
            return;
        }
        
        // Allow public access to view product reviews (GET only)
        // POST requests to add reviews require authentication
        if (path.startsWith("/api/reviews/product/") && "GET".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        
        // Skip JWT validation for public tracking endpoints
        // Match pattern: /api/orders/{any}/tracking or /api/orders/{any}/location-tracking
        if (path.matches("/api/orders/[^/]+/tracking") || path.matches("/api/orders/[^/]+/location-tracking")) {
            chain.doFilter(request, response);
            return;
        }
        
        // Skip JWT validation for profile photo serving (public access)
        if (path.startsWith("/api/auth/profile/photo/") && "GET".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        
        final String authorizationHeader = request.getHeader("Authorization");
        
        String username = null;
        String jwt = null;
        String role = null;
        
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
            System.out.println("⚠️ No Authorization header found for path: " + path);
        }
        
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
                // Log all authorities for debugging
                System.out.println("📋 All authorities: " + authToken.getAuthorities());
            } else {
                System.out.println("❌ Token validation failed for user: " + username);
            }
        } else if (username == null && !path.startsWith("/api/auth/") && !path.startsWith("/api/products") 
                   && !path.matches("/api/orders/[^/]+/tracking") && !path.matches("/api/orders/[^/]+/location-tracking")) {
            System.out.println("⚠️ No username extracted for protected path: " + path);
        }
        
        chain.doFilter(request, response);
    }
}

