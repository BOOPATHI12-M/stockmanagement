package com.sudharshini.stockmanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Review Entity - Stores product reviews and ratings
 */
@Entity
@Table(name = "reviews")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Product product;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;
    
    @Column(name = "rating", nullable = false)
    private Integer rating; // 1-5 stars
    
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public Review() {
    }
    
    public Review(Long id, Product product, User user, Integer rating, String comment, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.product = product;
        this.user = user;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Product getProduct() {
        return product;
    }
    
    public void setProduct(Product product) {
        this.product = product;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Integer getRating() {
        return rating;
    }
    
    public void setRating(Integer rating) {
        this.rating = rating;
    }
    
    public String getComment() {
        return comment;
    }
    
    public void setComment(String comment) {
        this.comment = comment;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Helper methods for JSON serialization
    @com.fasterxml.jackson.annotation.JsonGetter("productId")
    public Long getProductId() {
        return product != null ? product.getId() : null;
    }
    
    @com.fasterxml.jackson.annotation.JsonGetter("productName")
    public String getProductName() {
        return product != null ? product.getName() : null;
    }
    
    @com.fasterxml.jackson.annotation.JsonGetter("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }
    
    @com.fasterxml.jackson.annotation.JsonGetter("userName")
    public String getUserName() {
        return user != null ? user.getName() : null;
    }
    
    @com.fasterxml.jackson.annotation.JsonGetter("userEmail")
    public String getUserEmail() {
        return user != null ? user.getEmail() : null;
    }
}
