package com.sudharshini.stockmanagement.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Product Entity - Stores product information
 */
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    @Column(nullable = false)
    private BigDecimal price;
    
    @Column(nullable = false)
    private Integer stockQuantity;
    
    private String imageUrl;
    
    @ManyToOne
    @JoinColumn(name = "supplier_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Supplier supplier;
    
    // Expiry date for perishable items
    private LocalDate expiryDate;
    
    private String category;
    
    private String sku; // Stock Keeping Unit
    
    private LocalDateTime createdAt;
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
    
    /**
     * Check if product is low in stock (< 10)
     */
    public boolean isLowStock() {
        return stockQuantity != null && stockQuantity < 10;
    }
    
    /**
     * Check if product is near expiry (< 15 days)
     */
    public boolean isNearExpiry() {
        if (expiryDate == null) return false;
        return expiryDate.isBefore(LocalDate.now().plusDays(15)) 
            && expiryDate.isAfter(LocalDate.now());
    }
    
    // Constructors
    public Product() {
    }
    
    public Product(Long id, String name, String description, BigDecimal price, Integer stockQuantity, String imageUrl, Supplier supplier, LocalDate expiryDate, String category, String sku, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.imageUrl = imageUrl;
        this.supplier = supplier;
        this.expiryDate = expiryDate;
        this.category = category;
        this.sku = sku;
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
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public BigDecimal getPrice() {
        return price;
    }
    
    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    
    public Integer getStockQuantity() {
        return stockQuantity;
    }
    
    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }
    
    public String getImageUrl() {
        return imageUrl;
    }
    
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    public Supplier getSupplier() {
        return supplier;
    }
    
    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }
    
    public LocalDate getExpiryDate() {
        return expiryDate;
    }
    
    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getSku() {
        return sku;
    }
    
    public void setSku(String sku) {
        this.sku = sku;
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
}

