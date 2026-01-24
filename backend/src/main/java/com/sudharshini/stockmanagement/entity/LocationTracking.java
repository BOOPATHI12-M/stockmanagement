package com.sudharshini.stockmanagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Location Tracking Entity - Stores real-time location updates for delivery tracking
 */
@Entity
@Table(name = "location_tracking")
public class LocationTracking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
    
    private String address;
    
    private Double accuracy; // GPS accuracy in meters
    
    private Double speed; // Speed in m/s
    
    private Double heading; // Direction in degrees
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
    
    // Constructors
    public LocationTracking() {
    }
    
    public LocationTracking(Order order, Double latitude, Double longitude, String address, LocalDateTime timestamp) {
        this.order = order;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.timestamp = timestamp;
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
    
    public Double getLatitude() {
        return latitude;
    }
    
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    
    public Double getLongitude() {
        return longitude;
    }
    
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
    
    public String getAddress() {
        return address;
    }
    
    public void setAddress(String address) {
        this.address = address;
    }
    
    public Double getAccuracy() {
        return accuracy;
    }
    
    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }
    
    public Double getSpeed() {
        return speed;
    }
    
    public void setSpeed(Double speed) {
        this.speed = speed;
    }
    
    public Double getHeading() {
        return heading;
    }
    
    public void setHeading(Double heading) {
        this.heading = heading;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
