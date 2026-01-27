package com.sudharshini.stockmanagement.service;

import com.sudharshini.stockmanagement.entity.Order;
import com.sudharshini.stockmanagement.entity.Product;
import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
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

    // SendGrid configuration from environment (optional). When present, we use HTTP API.
    @Value("${SENDGRID_API_KEY:}")
    private String sendGridApiKey;

    @Value("${MAIL_FROM:${MAIL_USERNAME:}}")
    private String mailFrom;
    
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    
    /**
     * Send order confirmation email to customer
     */
    @Async
    public void sendOrderConfirmation(Order order) {
        sendEmail(order.getDeliveryEmail(),
                "Order Confirmation - " + order.getOrderNumber(),
                buildOrderConfirmationBody(order));
    }
    
    /**
     * Send order status update email to customer
     * Sends email for all order status changes (ACCEPTED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
     */
    @Async
    public void sendOrderStatusUpdate(Order order) {
        try {
            sendEmail(order.getDeliveryEmail(),
                    "Order Status Update - " + order.getOrderNumber(),
                    buildOrderStatusUpdateBody(order));
            System.out.println("✅ Email status update queued for Order #" + order.getOrderNumber() + " - Status: " + order.getStatus());
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
        sendEmail(adminEmail,
                "Low Stock Alert – " + product.getName(),
                buildLowStockBody(product));
    }
    
    /**
     * Send near expiry alert to admin
     */
    @Async
    public void sendExpiryAlert(Product product) {
        sendEmail(adminEmail,
                "Product Expiring Soon – " + product.getName(),
                buildExpiryBody(product));
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
        try {
            sendEmail(email,
                    "Your OTP for Sudharshini Stock Management",
                    buildOtpBody(otpCode));
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage(), e);
        }
    }

    /**
     * Unified email sender. Uses SendGrid HTTP API when SENDGRID_API_KEY is present,
     * otherwise falls back to JavaMailSender (SMTP).
     */
    private void sendEmail(String to, String subject, String body) {
        if (sendGridAvailable()) {
            sendViaSendGrid(to, subject, body);
            return;
        }
        // Fallback to SMTP
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    private boolean sendGridAvailable() {
        return sendGridApiKey != null && !sendGridApiKey.isBlank();
    }

    private void sendViaSendGrid(String to, String subject, String body) {
        try {
            Email fromEmail = new Email(mailFrom == null || mailFrom.isBlank() ? "no-reply@sudharshini.com" : mailFrom);
            Email toEmail = new Email(to);
            Content content = new Content("text/plain", body);
            Mail mail = new Mail(fromEmail, subject, toEmail, content);

            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                System.out.println("📧 SendGrid: Email sent successfully (" + response.getStatusCode() + ")");
            } else {
                System.err.println("⚠️ SendGrid: Failed to send email (" + response.getStatusCode() + ") - " + response.getBody());
            }
        } catch (Exception ex) {
            System.err.println("❌ SendGrid error: " + ex.getMessage());
            throw new RuntimeException("SendGrid email send failed", ex);
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

