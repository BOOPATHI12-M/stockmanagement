package com.sudharshini.stockmanagement.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security Configuration
 * Handles CORS and endpoint security
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Value("${cors.allowed.origins}")
    private String allowedOrigins;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow OPTIONS requests for CORS preflight (must be first)
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                // Public endpoints
                .requestMatchers("/").permitAll() // Allow root path
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/auth/admin/login").permitAll() // Allow login for admin and delivery man
                .requestMatchers("/api/auth/admin/proof-documents/**").authenticated() // Allow authenticated users to view proof documents
                .requestMatchers("/api/auth/admin/**").hasRole("ADMIN") // Other admin-only auth endpoints
                .requestMatchers("/api/auth/**").permitAll() // Public auth endpoints (profile endpoints require auth via JWT filter)
                .requestMatchers("/api/products").permitAll()
                .requestMatchers("/api/products/**").permitAll() // Allow public access to all product endpoints
                .requestMatchers("/api/auth/profile/photo/**").permitAll() // Allow public access to profile photos
                .requestMatchers("/api/reviews/product/**").permitAll() // Allow public access to view reviews
                .requestMatchers("/api/reviews/**").authenticated() // Require auth for adding/deleting reviews
                .requestMatchers("/api/cart/**").authenticated()
                // Public tracking endpoints - must be before /api/orders/** to match first
                .requestMatchers("/api/orders/*/tracking").permitAll()
                // Location tracking is public (like tracking) - must be before /api/orders/** to match first
                .requestMatchers("/api/orders/*/location-tracking").permitAll()
                // Admin-only order endpoints
                .requestMatchers("/api/orders/all").hasRole("ADMIN")
                .requestMatchers("/api/orders/**").authenticated()
                .requestMatchers("/api/delivery/**").authenticated() // Allow authenticated users (DELIVERY_MAN or ADMIN)
                // Admin-only report endpoints
                .requestMatchers("/api/reports/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Parse comma-separated origins from environment variable
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.addExposedHeader("Authorization");
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

