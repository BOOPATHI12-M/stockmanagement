package com.sudharshini.stockmanagement.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Order Item Entity - Stores individual items in an order
 */
@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    @JsonBackReference
    private Order order;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @org.hibernate.annotations.NotFound(action = org.hibernate.annotations.NotFoundAction.IGNORE)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"supplier", "createdAt", "updatedAt"})
    private Product product;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    private BigDecimal unitPrice;
    
    @Column(nullable = false)
    private BigDecimal totalPrice;
    
    // Constructors
    public OrderItem() {
    }
    
    public OrderItem(Long id, Order order, Product product, Integer quantity, BigDecimal unitPrice, BigDecimal totalPrice) {
        this.id = id;
        this.order = order;
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Order getOrder() {
        return order;
    }
    
    public void setOrder(Order order) {
        this.order = order;
    }
    
    public Product getProduct() {
        return product;
    }
    
    public void setProduct(Product product) {
        this.product = product;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public BigDecimal getUnitPrice() {
        return unitPrice;
    }
    
    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
    
    public BigDecimal getTotalPrice() {
        return totalPrice;
    }
    
    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
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
}
