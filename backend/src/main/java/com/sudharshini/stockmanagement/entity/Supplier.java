package com.sudharshini.stockmanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Supplier Entity - Stores supplier information
 */
@Entity
@Table(name = "suppliers")
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String email;
    
    private String phone;
    
    private String address;
    
    private String contactPerson;
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "supplier", cascade = CascadeType.ALL)
    private List<Product> products;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    // Constructors
    public Supplier() {
    }
    
    public Supplier(Long id, String name, String email, String phone, String address, String contactPerson, LocalDateTime createdAt, List<Product> products) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.contactPerson = contactPerson;
        this.createdAt = createdAt;
        this.products = products;
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
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public String getContactPerson() {
        return contactPerson;
    }
    
    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public List<Product> getProducts() {
        return products;
    }
    
    public void setProducts(List<Product> products) {
        this.products = products;
    }
}
