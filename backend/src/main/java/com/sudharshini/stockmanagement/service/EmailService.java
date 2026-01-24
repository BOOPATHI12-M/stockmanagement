package com.sudharshini.stockmanagement.service;

import com.sudharshini.stockmanagement.entity.Order;
import com.sudharshini.stockmanagement.entity.Product;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Email Service
 * Handles sending emails for order confirmations and low stock alerts
 */
@Service
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${admin.email}")
    private String adminEmail;
    
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    /**
     * Send order confirmation email to customer
     */
    @Async
    public void sendOrderConfirmation(Order order) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(order.getDeliveryEmail());
        message.setSubject("Order Confirmation - " + order.getOrderNumber());
        message.setText(buildOrderConfirmationBody(order));
        mailSender.send(message);
    }
    
    /**
     * Send order status update email to customer
     * Sends email for all order status changes (ACCEPTED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
     */
    @Async
    public void sendOrderStatusUpdate(Order order) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(order.getDeliveryEmail());
        message.setSubject("Order Status Update - " + order.getOrderNumber());
        message.setText(buildOrderStatusUpdateBody(order));
        try {
            mailSender.send(message);
            System.out.println("✅ Email status update sent for Order #" + order.getOrderNumber() + " - Status: " + order.getStatus());
        } catch (Exception e) {
            System.err.println("❌ Failed to send email status update: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Send low stock alert to admin
     */
    @Async
    public void sendLowStockAlert(Product product) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail);
        message.setSubject("Low Stock Alert – " + product.getName());
        message.setText(buildLowStockBody(product));
        mailSender.send(message);
    }
    
    /**
     * Send near expiry alert to admin
     */
    @Async
    public void sendExpiryAlert(Product product) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail);
        message.setSubject("Product Expiring Soon – " + product.getName());
        message.setText(buildExpiryBody(product));
        mailSender.send(message);
    }
    
    private String buildOrderConfirmationBody(Order order) {
        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(order.getDeliveryName()).append(",\n\n");
        body.append("Thank you for your order!\n\n");
        body.append("Order Details:\n");
        body.append("Order Number: ").append(order.getOrderNumber()).append("\n");
        body.append("Total Amount: ₹").append(order.getTotalAmount()).append("\n");
        body.append("Payment Mode: ").append(order.getPaymentMode()).append("\n\n");
        body.append("Delivery Window: ");
        body.append(order.getEstimatedDeliveryStart()).append(" to ");
        body.append(order.getEstimatedDeliveryEnd()).append("\n\n");
        body.append("Tracking ID: ").append(order.getTrackingId()).append("\n");
        body.append("Track your order: http://localhost:3000/track/").append(order.getId()).append("\n\n");
        body.append("Items:\n");
        order.getItems().forEach(item -> {
            body.append("- ").append(item.getProduct().getName())
                .append(" x ").append(item.getQuantity())
                .append(" = ₹").append(item.getTotalPrice()).append("\n");
        });
        body.append("\nThank you for shopping with Sudharshini Stock Management!\n");
        return body.toString();
    }
    
    private String buildLowStockBody(Product product) {
        return "Low Stock Alert\n\n" +
               "Product: " + product.getName() + "\n" +
               "Current Stock: " + product.getStockQuantity() + "\n" +
               "SKU: " + product.getSku() + "\n\n" +
               "Please restock this product soon.";
    }
    
    private String buildExpiryBody(Product product) {
        return "Product Expiring Soon\n\n" +
               "Product: " + product.getName() + "\n" +
               "Expiry Date: " + product.getExpiryDate() + "\n" +
               "Current Stock: " + product.getStockQuantity() + "\n\n" +
               "Please take necessary action.";
    }
    
    /**
     * Send OTP email to user (synchronous for immediate feedback)
     */
    public void sendOtpEmail(String email, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Your OTP for Sudharshini Stock Management");
        message.setText(buildOtpBody(otpCode));
        try {
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage(), e);
        }
    }
    
    private String buildOtpBody(String otpCode) {
        return "Your OTP for Sudharshini Stock Management\n\n" +
               "Your verification code is: " + otpCode + "\n\n" +
               "This code will expire in 10 minutes.\n\n" +
               "If you didn't request this code, please ignore this email.\n\n" +
               "Thank you!";
    }
    
    private String buildOrderStatusUpdateBody(Order order) {
        StringBuilder body = new StringBuilder();
        body.append("Dear ").append(order.getDeliveryName()).append(",\n\n");
        
        String statusMessage = getStatusMessage(order.getStatus());
        String statusDescription = getStatusDescription(order.getStatus());
        
        body.append(statusMessage).append("\n\n");
        body.append("Order Number: ").append(order.getOrderNumber()).append("\n");
        body.append("Status: ").append(order.getStatus()).append("\n");
        body.append("Amount: ₹").append(order.getTotalAmount()).append("\n\n");
        body.append(statusDescription).append("\n");
        
        // Add tracking information
        body.append("Tracking ID: ").append(order.getTrackingId()).append("\n");
        body.append("Track your order: http://localhost:3000/track/").append(order.getId()).append("\n\n");
        
        // Add delivery man information if assigned
        if (order.getAssignedTo() != null) {
            body.append("Delivery Man: ").append(order.getAssignedTo().getName()).append("\n");
        }
        
        // Add timestamps
        if (order.getAcceptedAt() != null) {
            body.append("Accepted At: ").append(order.getAcceptedAt()).append("\n");
        }
        if (order.getPickedUpAt() != null) {
            body.append("Picked Up At: ").append(order.getPickedUpAt()).append("\n");
        }
        if (order.getOutForDeliveryAt() != null) {
            body.append("Out for Delivery At: ").append(order.getOutForDeliveryAt()).append("\n");
        }
        if (order.getDeliveredAt() != null) {
            body.append("Delivered At: ").append(order.getDeliveredAt()).append("\n");
        }
        
        body.append("\nThank you for shopping with Sudharshini Stock Management!\n");
        return body.toString();
    }
    
    private String getStatusMessage(Order.OrderStatus status) {
        return switch (status) {
            case ACCEPTED -> "✅ Your order has been accepted by our delivery team!";
            case PICKED_UP -> "📦 Your order has been picked up!";
            case OUT_FOR_DELIVERY -> "🚚 Your order is out for delivery!";
            case DELIVERED -> "🎉 Your order has been delivered!";
            case CANCELLED -> "❌ Your order has been cancelled.";
            default -> "📋 Order Status Update";
        };
    }
    
    private String getStatusDescription(Order.OrderStatus status) {
        return switch (status) {
            case ACCEPTED -> "Our delivery team has accepted your order and will pick it up soon.";
            case PICKED_UP -> "Your order has been collected from our warehouse and is being prepared for delivery.";
            case OUT_FOR_DELIVERY -> "Your order is on its way! Our delivery person is heading to your address.";
            case DELIVERED -> "Your order has been successfully delivered. Thank you for your purchase!";
            case CANCELLED -> "Your order has been cancelled. If you have any questions, please contact support.";
            default -> "Your order status has been updated.";
        };
    }
}

