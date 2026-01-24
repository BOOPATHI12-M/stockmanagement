package com.sudharshini.stockmanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Stock Movement Entity - Tracks all stock IN and OUT transactions
 */
@Entity
@Table(name = "stock_movements")
public class StockMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MovementType type; // IN or OUT
    
    @Column(nullable = false)
    private Integer quantity;
    
    private String reason; // e.g., "Purchase", "Damage", "Adjustment"
    
    private String notes;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum MovementType {
        IN, OUT
    }
    
    // Constructors
    public StockMovement() {
    }
    
    public StockMovement(Long id, Product product, MovementType type, Integer quantity, String reason, String notes, LocalDateTime createdAt) {
        this.id = id;
        this.product = product;
        this.type = type;
        this.quantity = quantity;
        this.reason = reason;
        this.notes = notes;
        this.createdAt = createdAt;
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
    
    public MovementType getType() {
        return type;
    }
    
    public void setType(MovementType type) {
        this.type = type;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
