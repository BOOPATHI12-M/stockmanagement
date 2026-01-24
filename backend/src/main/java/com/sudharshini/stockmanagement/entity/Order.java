package com.sudharshini.stockmanagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Order Entity - Stores customer orders
 */
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String orderNumber; // e.g., "ORD-2024-001"
    
    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnore
    private User customer;
    
    @Column(nullable = false)
    private BigDecimal totalAmount;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode;
    
    // Delivery Information
    private String deliveryName;
    private String deliveryEmail;
    private String deliveryMobile;
    private String deliveryAddress;
    private String deliveryPincode;
    
    // Delivery window
    private LocalDate estimatedDeliveryStart;
    private LocalDate estimatedDeliveryEnd;
    
    // Tracking
    private String trackingId;
    private String courierName;
    
    // Delivery Assignment
    @ManyToOne
    @JoinColumn(name = "assigned_to")
    @JsonIgnore
    private User assignedTo; // Delivery man assigned to this order
    
    // Location Information
    private String pickupLocation; // JSON: {"lat": 0.0, "lng": 0.0, "address": "..."}
    private String deliveryLocation; // JSON: {"lat": 0.0, "lng": 0.0, "address": "..."}
    private String currentLocation; // JSON: {"lat": 0.0, "lng": 0.0, "timestamp": "..."} - Real-time delivery man location
    
    // Delivery Timestamps
    private LocalDateTime acceptedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime outForDeliveryAt;
    private LocalDateTime deliveredAt;
    
    // Cancellation
    @Column(columnDefinition = "TEXT")
    private String cancellationReason;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<OrderItem> items;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<TrackingEvent> trackingEvents;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (orderNumber == null) {
            orderNumber = "ORD-" + System.currentTimeMillis();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum OrderStatus {
        PENDING, CONFIRMED, PROCESSING, ACCEPTED, PICKED_UP, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    }
    
    public enum PaymentMode {
        CASH_ON_DELIVERY, ONLINE, UPI, CARD
    }
    
    // Constructors
    public Order() {
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getOrderNumber() {
        return orderNumber;
    }
    
    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }
    
    public User getCustomer() {
        return customer;
    }
    
    public void setCustomer(User customer) {
        this.customer = customer;
    }
    
    // Helper method to get customer email for JSON serialization
    @com.fasterxml.jackson.annotation.JsonGetter("customerEmail")
    public String getCustomerEmail() {
        return customer != null ? customer.getEmail() : null;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public OrderStatus getStatus() {
        return status;
    }
    
    public void setStatus(OrderStatus status) {
        this.status = status;
    }
    
    public PaymentMode getPaymentMode() {
        return paymentMode;
    }
    
    public void setPaymentMode(PaymentMode paymentMode) {
        this.paymentMode = paymentMode;
    }
    
    public String getDeliveryName() {
        return deliveryName;
    }
    
    public void setDeliveryName(String deliveryName) {
        this.deliveryName = deliveryName;
    }
    
    public String getDeliveryEmail() {
        return deliveryEmail;
    }
    
    public void setDeliveryEmail(String deliveryEmail) {
        this.deliveryEmail = deliveryEmail;
    }
    
    public String getDeliveryMobile() {
        return deliveryMobile;
    }
    
    public void setDeliveryMobile(String deliveryMobile) {
        this.deliveryMobile = deliveryMobile;
    }
    
    public String getDeliveryAddress() {
        return deliveryAddress;
    }
    
    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }
    
    public String getDeliveryPincode() {
        return deliveryPincode;
    }
    
    public void setDeliveryPincode(String deliveryPincode) {
        this.deliveryPincode = deliveryPincode;
    }
    
    public LocalDate getEstimatedDeliveryStart() {
        return estimatedDeliveryStart;
    }
    
    public void setEstimatedDeliveryStart(LocalDate estimatedDeliveryStart) {
        this.estimatedDeliveryStart = estimatedDeliveryStart;
    }
    
    public LocalDate getEstimatedDeliveryEnd() {
        return estimatedDeliveryEnd;
    }
    
    public void setEstimatedDeliveryEnd(LocalDate estimatedDeliveryEnd) {
        this.estimatedDeliveryEnd = estimatedDeliveryEnd;
    }
    
    public String getTrackingId() {
        return trackingId;
    }
    
    public void setTrackingId(String trackingId) {
        this.trackingId = trackingId;
    }
    
    public String getCourierName() {
        return courierName;
    }
    
    public void setCourierName(String courierName) {
        this.courierName = courierName;
    }
    
    public List<OrderItem> getItems() {
        return items;
    }
    
    public void setItems(List<OrderItem> items) {
        this.items = items;
    }
    
    public List<TrackingEvent> getTrackingEvents() {
        return trackingEvents;
    }
    
    public void setTrackingEvents(List<TrackingEvent> trackingEvents) {
        this.trackingEvents = trackingEvents;
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
    
    // Delivery Assignment Getters and Setters
    public User getAssignedTo() {
        return assignedTo;
    }
    
    public void setAssignedTo(User assignedTo) {
        this.assignedTo = assignedTo;
    }
    
    @com.fasterxml.jackson.annotation.JsonGetter("assignedToName")
    public String getAssignedToName() {
        return assignedTo != null ? assignedTo.getName() : null;
    }
    
    @com.fasterxml.jackson.annotation.JsonGetter("assignedToId")
    public Long getAssignedToId() {
        return assignedTo != null ? assignedTo.getId() : null;
    }
    
    public String getPickupLocation() {
        return pickupLocation;
    }
    
    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }
    
    public String getDeliveryLocation() {
        return deliveryLocation;
    }
    
    public void setDeliveryLocation(String deliveryLocation) {
        this.deliveryLocation = deliveryLocation;
    }
    
    public String getCurrentLocation() {
        return currentLocation;
    }
    
    public void setCurrentLocation(String currentLocation) {
        this.currentLocation = currentLocation;
    }
    
    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }
    
    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }
    
    public LocalDateTime getPickedUpAt() {
        return pickedUpAt;
    }
    
    public void setPickedUpAt(LocalDateTime pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
    }
    
    public LocalDateTime getOutForDeliveryAt() {
        return outForDeliveryAt;
    }
    
    public void setOutForDeliveryAt(LocalDateTime outForDeliveryAt) {
        this.outForDeliveryAt = outForDeliveryAt;
    }
    
    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }
    
    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
    
    public String getCancellationReason() {
        return cancellationReason;
    }
    
    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}
