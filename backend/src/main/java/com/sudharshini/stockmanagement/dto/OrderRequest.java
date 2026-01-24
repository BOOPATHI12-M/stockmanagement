package com.sudharshini.stockmanagement.dto;

import java.util.List;

/**
 * DTO for creating a new order
 */
public class OrderRequest {
    private List<OrderItemRequest> items;
    private String deliveryName;
    private String deliveryEmail;
    private String deliveryMobile;
    private String deliveryAddress;
    private String deliveryPincode;
    private String paymentMode;
    
    // Constructors
    public OrderRequest() {
    }
    
    // Getters and Setters
    public List<OrderItemRequest> getItems() {
        return items;
    }
    
    public void setItems(List<OrderItemRequest> items) {
        this.items = items;
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
    
    public String getPaymentMode() {
        return paymentMode;
    }
    
    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }
    
    public static class OrderItemRequest {
        private Long productId;
        private Integer quantity;
        
        // Constructors
        public OrderItemRequest() {
        }
        
        public OrderItemRequest(Long productId, Integer quantity) {
            this.productId = productId;
            this.quantity = quantity;
        }
        
        // Getters and Setters
        public Long getProductId() {
            return productId;
        }
        
        public void setProductId(Long productId) {
            this.productId = productId;
        }
        
        public Integer getQuantity() {
            return quantity;
        }
        
        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}
