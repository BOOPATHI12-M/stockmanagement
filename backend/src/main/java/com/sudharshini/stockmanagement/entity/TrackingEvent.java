package com.sudharshini.stockmanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Tracking Event Entity - Stores tracking timeline events for orders
 */
@Entity
@Table(name = "tracking_events")
public class TrackingEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private EventType eventType;
    
    @Column(nullable = false)
    private String description;
    
    private String location;
    
    @Column(nullable = false)
    private LocalDateTime eventTime;
    
    @Column(nullable = false)
    private Integer sequence; // Order of events in timeline
    
    @PrePersist
    protected void onCreate() {
        if (eventTime == null) {
            eventTime = LocalDateTime.now();
        }
    }
    
    public enum EventType {
        LABEL_CREATED,
        SHIPMENT_PICKED,
        PACKAGE_RECEIVED_AT_FACILITY,
        PACKAGE_LEFT_FACILITY,
        PACKAGE_ARRIVED_AT_LOCAL_FACILITY,
        OUT_FOR_DELIVERY,
        DELIVERED
    }
    
    // Constructors
    public TrackingEvent() {
    }
    
    public TrackingEvent(Long id, Order order, EventType eventType, String description, String location, LocalDateTime eventTime, Integer sequence) {
        this.id = id;
        this.order = order;
        this.eventType = eventType;
        this.description = description;
        this.location = location;
        this.eventTime = eventTime;
        this.sequence = sequence;
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
    
    public EventType getEventType() {
        return eventType;
    }
    
    public void setEventType(EventType eventType) {
        this.eventType = eventType;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public LocalDateTime getEventTime() {
        return eventTime;
    }
    
    public void setEventTime(LocalDateTime eventTime) {
        this.eventTime = eventTime;
    }
    
    public Integer getSequence() {
        return sequence;
    }
    
    public void setSequence(Integer sequence) {
        this.sequence = sequence;
    }
}
