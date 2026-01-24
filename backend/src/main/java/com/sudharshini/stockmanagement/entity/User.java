package com.sudharshini.stockmanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * User Entity - Stores both customers and admin users
 */
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    private String name;
    
    private String mobile;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserRole role; // CUSTOMER or ADMIN
    
    // For admin login
    private String username;
    private String password; // Hashed
    
    // For Google OAuth
    private String googleId;
    
    // Profile photo URL
    private String photoUrl;
    
    // Proof documents for delivery men
    private String aadhaarCardUrl;
    private String panCardUrl;
    private String drivingLicenseUrl;
    private String otherProofUrl;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum UserRole {
        CUSTOMER, ADMIN, DELIVERY_MAN
    }
    
    // Constructors
    public User() {
    }
    
    public User(Long id, String email, String name, String mobile, UserRole role, String username, String password, String googleId, String photoUrl, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.mobile = mobile;
        this.role = role;
        this.username = username;
        this.password = password;
        this.googleId = googleId;
        this.photoUrl = photoUrl;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getMobile() {
        return mobile;
    }
    
    public void setMobile(String mobile) {
        this.mobile = mobile;
    }
    
    public UserRole getRole() {
        return role;
    }
    
    public void setRole(UserRole role) {
        this.role = role;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getGoogleId() {
        return googleId;
    }
    
    public void setGoogleId(String googleId) {
        this.googleId = googleId;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getPhotoUrl() {
        return photoUrl;
    }
    
    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }
    
    public String getAadhaarCardUrl() {
        return aadhaarCardUrl;
    }
    
    public void setAadhaarCardUrl(String aadhaarCardUrl) {
        this.aadhaarCardUrl = aadhaarCardUrl;
    }
    
    public String getPanCardUrl() {
        return panCardUrl;
    }
    
    public void setPanCardUrl(String panCardUrl) {
        this.panCardUrl = panCardUrl;
    }
    
    public String getDrivingLicenseUrl() {
        return drivingLicenseUrl;
    }
    
    public void setDrivingLicenseUrl(String drivingLicenseUrl) {
        this.drivingLicenseUrl = drivingLicenseUrl;
    }
    
    public String getOtherProofUrl() {
        return otherProofUrl;
    }
    
    public void setOtherProofUrl(String otherProofUrl) {
        this.otherProofUrl = otherProofUrl;
    }
}

