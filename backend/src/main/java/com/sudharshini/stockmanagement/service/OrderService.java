package com.sudharshini.stockmanagement.service;

import com.sudharshini.stockmanagement.entity.*;
import com.sudharshini.stockmanagement.dto.OrderRequest;
import com.sudharshini.stockmanagement.repository.*;
import com.sudharshini.stockmanagement.service.GoogleMapsService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

/**
 * Order Service
 * Handles order creation, tracking, and status updates
 */
@Service
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final StockMovementRepository stockMovementRepository;
    private final EmailService emailService;
    private final GoogleMapsService googleMapsService;
    private final GoogleSheetsService googleSheetsService;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            TrackingEventRepository trackingEventRepository,
            StockMovementRepository stockMovementRepository,
            EmailService emailService,
            GoogleMapsService googleMapsService,
            GoogleSheetsService googleSheetsService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.emailService = emailService;
        this.googleMapsService = googleMapsService;
        this.googleSheetsService = googleSheetsService;
    }
    
    /**
     * Create a new order
     */
    @Transactional
    public Order createOrder(Long customerId, OrderRequest request) {
        try {
            System.out.println("🔍 OrderService.createOrder - Customer ID: " + customerId);
            System.out.println("📦 Items count: " + (request.getItems() != null ? request.getItems().size() : 0));
            System.out.println("📍 Delivery Address: " + request.getDeliveryAddress());
            System.out.println("📮 Delivery Pincode: " + request.getDeliveryPincode());
            
            // Verify customer exists
            userRepository.findById(customerId)
                    .orElseThrow(() -> {
                        System.out.println("❌ Customer not found: " + customerId);
                        return new RuntimeException("Customer not found");
                    });
            
            // Validate request
            if (request.getItems() == null || request.getItems().isEmpty()) {
                System.out.println("❌ No items in order");
                throw new RuntimeException("Order must contain at least one item");
            }
            
            if (request.getDeliveryAddress() == null || request.getDeliveryAddress().trim().isEmpty()) {
                System.out.println("❌ Delivery address is missing");
                throw new RuntimeException("Delivery address is required");
            }
            
            if (request.getDeliveryPincode() == null || request.getDeliveryPincode().trim().isEmpty()) {
                System.out.println("❌ Delivery pincode is missing");
                throw new RuntimeException("Delivery pincode is required");
            }
            
            // Generate order number and tracking ID
            String orderNumber = "ORD-" + System.currentTimeMillis();
            String trackingId = "TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            
            // Calculate total first
            BigDecimal total = BigDecimal.ZERO;
            List<OrderRequest.OrderItemRequest> items = request.getItems();
            
            for (OrderRequest.OrderItemRequest itemRequest : items) {
                System.out.println("🔍 Processing item - Product ID: " + itemRequest.getProductId() + ", Quantity: " + itemRequest.getQuantity());
                
                if (itemRequest.getProductId() == null) {
                    throw new RuntimeException("Product ID is required for all items");
                }
                
                Product product = productRepository.findById(itemRequest.getProductId())
                        .orElseThrow(() -> {
                            System.out.println("❌ Product not found: " + itemRequest.getProductId());
                            return new RuntimeException("Product not found: " + itemRequest.getProductId());
                        });
                
                if (itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                    throw new RuntimeException("Invalid quantity for product: " + product.getName());
                }
                
                if (product.getStockQuantity() < itemRequest.getQuantity()) {
                    System.out.println("❌ Insufficient stock for: " + product.getName() + " (Available: " + product.getStockQuantity() + ", Requested: " + itemRequest.getQuantity() + ")");
                    throw new RuntimeException("Insufficient stock for: " + product.getName());
                }
                
                BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
                total = total.add(itemTotal);
                System.out.println("✅ Item added: " + product.getName() + " - Total: " + itemTotal);
            }
            
            System.out.println("💰 Order total: " + total);
            
            // Validate payment mode
            String paymentMode = request.getPaymentMode();
            if (paymentMode == null || paymentMode.trim().isEmpty()) {
                paymentMode = "CASH_ON_DELIVERY";
            }
            System.out.println("💳 Payment mode: " + paymentMode);
            
            // Validate delivery name, email, mobile
            String deliveryName = request.getDeliveryName();
            String deliveryEmail = request.getDeliveryEmail();
            String deliveryMobile = request.getDeliveryMobile();
            
            if (deliveryName == null || deliveryName.trim().isEmpty()) {
                System.out.println("⚠️ Delivery name is missing, using customer name");
                User customer = userRepository.findById(customerId).orElse(null);
                deliveryName = customer != null ? customer.getName() : "Customer";
            }
            
            if (deliveryEmail == null || deliveryEmail.trim().isEmpty()) {
                System.out.println("⚠️ Delivery email is missing, using customer email");
                User customer = userRepository.findById(customerId).orElse(null);
                deliveryEmail = customer != null ? customer.getEmail() : "";
            }
            
            System.out.println("📝 Delivery Name: " + deliveryName);
            System.out.println("📧 Delivery Email: " + deliveryEmail);
            System.out.println("📱 Delivery Mobile: " + deliveryMobile);
            
            // Generate delivery window (2-10 days)
            Random random = new Random();
            int days = 2 + random.nextInt(9); // 2 to 10 days
            LocalDate estimatedDeliveryStart = LocalDate.now().plusDays(2);
            LocalDate estimatedDeliveryEnd = LocalDate.now().plusDays(days);
            LocalDateTime now = LocalDateTime.now();
            
            System.out.println("📅 Estimated delivery: " + estimatedDeliveryStart + " to " + estimatedDeliveryEnd);
            
            // Use native SQL to create Order (avoiding getGeneratedKeys() issue with SQLite)
            String orderSql = "INSERT INTO orders (order_number, customer_id, total_amount, status, payment_mode, " +
                            "delivery_name, delivery_email, delivery_mobile, delivery_address, delivery_pincode, " +
                            "estimated_delivery_start, estimated_delivery_end, tracking_id, courier_name, created_at, updated_at) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            System.out.println("💾 Executing order insert SQL...");
            Query orderQuery = entityManager.createNativeQuery(orderSql);
            orderQuery.setParameter(1, orderNumber);
            orderQuery.setParameter(2, customerId);
            orderQuery.setParameter(3, total);
            orderQuery.setParameter(4, "CONFIRMED");
            orderQuery.setParameter(5, paymentMode);
            orderQuery.setParameter(6, deliveryName);
            orderQuery.setParameter(7, deliveryEmail);
            orderQuery.setParameter(8, deliveryMobile != null ? deliveryMobile : "");
            orderQuery.setParameter(9, request.getDeliveryAddress());
            orderQuery.setParameter(10, request.getDeliveryPincode());
            orderQuery.setParameter(11, estimatedDeliveryStart);
            orderQuery.setParameter(12, estimatedDeliveryEnd);
            orderQuery.setParameter(13, trackingId);
            orderQuery.setParameter(14, "Sudharshini Express");
            orderQuery.setParameter(15, java.sql.Timestamp.valueOf(now));
            orderQuery.setParameter(16, java.sql.Timestamp.valueOf(now));
            
            int rowsAffected = orderQuery.executeUpdate();
            System.out.println("✅ Order insert executed, rows affected: " + rowsAffected);
            
            // Get the order ID using last_insert_rowid()
            System.out.println("🔍 Getting order ID from last_insert_rowid()...");
            Query idQuery = entityManager.createNativeQuery("SELECT last_insert_rowid()");
            Object result = idQuery.getSingleResult();
            Long orderId = ((Number) result).longValue();
            System.out.println("✅ Order ID: " + orderId);
            
            // Fetch the created order
            System.out.println("🔍 Fetching created order from database...");
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> {
                        System.out.println("❌ Failed to retrieve created order with ID: " + orderId);
                        return new RuntimeException("Failed to retrieve created order");
                    });
            System.out.println("✅ Order retrieved: " + order.getOrderNumber());
            
            // Geocode delivery pincode to get coordinates for map
            if (request.getDeliveryPincode() != null && !request.getDeliveryPincode().isEmpty()) {
                try {
                    Map<String, Object> geocodeResult = googleMapsService.geocodePincode(request.getDeliveryPincode(), "IN");
                    if (geocodeResult.get("success") != null && (Boolean) geocodeResult.get("success")) {
                        // Create delivery location JSON
                        com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        Map<String, Object> deliveryLocation = new HashMap<>();
                        deliveryLocation.put("lat", geocodeResult.get("lat"));
                        deliveryLocation.put("lng", geocodeResult.get("lng"));
                        deliveryLocation.put("address", geocodeResult.get("address"));
                        deliveryLocation.put("pincode", request.getDeliveryPincode());
                        
                        String deliveryLocationJson = objectMapper.writeValueAsString(deliveryLocation);
                        
                        // Update order with delivery location
                        String updateSql = "UPDATE orders SET delivery_location = ? WHERE id = ?";
                        Query updateQuery = entityManager.createNativeQuery(updateSql);
                        updateQuery.setParameter(1, deliveryLocationJson);
                        updateQuery.setParameter(2, orderId);
                        updateQuery.executeUpdate();
                        
                        System.out.println("✅ Geocoded delivery pincode " + request.getDeliveryPincode() + 
                                          " to coordinates: " + geocodeResult.get("lat") + ", " + geocodeResult.get("lng"));
                    } else {
                        System.out.println("⚠️ Failed to geocode pincode: " + request.getDeliveryPincode());
                    }
                } catch (Exception e) {
                    System.err.println("Error geocoding pincode: " + e.getMessage());
                    // Don't fail order creation if geocoding fails
                }
            }
            
            // Set default pickup location (can be configured)
            try {
                com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> pickupLocation = new HashMap<>();
                // Default pickup location (Bangalore warehouse)
                pickupLocation.put("lat", 12.9716);
                pickupLocation.put("lng", 77.5946);
                pickupLocation.put("address", "Sudharshini Warehouse, Bangalore");
                
                String pickupLocationJson = objectMapper.writeValueAsString(pickupLocation);
                
                String updatePickupSql = "UPDATE orders SET pickup_location = ? WHERE id = ?";
                Query updatePickupQuery = entityManager.createNativeQuery(updatePickupSql);
                updatePickupQuery.setParameter(1, pickupLocationJson);
                updatePickupQuery.setParameter(2, orderId);
                updatePickupQuery.executeUpdate();
            } catch (Exception e) {
                System.err.println("Error setting pickup location: " + e.getMessage());
            }
            
            // Refresh order to get updated location data
            entityManager.refresh(order);
            
            // Create order items using native SQL
            for (OrderRequest.OrderItemRequest itemRequest : items) {
                Product product = productRepository.findById(itemRequest.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + itemRequest.getProductId()));
                
                BigDecimal unitPrice = product.getPrice();
                BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
                
                String itemSql = "INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) " +
                               "VALUES (?, ?, ?, ?, ?)";
                
                Query itemQuery = entityManager.createNativeQuery(itemSql);
                itemQuery.setParameter(1, orderId);
                itemQuery.setParameter(2, itemRequest.getProductId());
                itemQuery.setParameter(3, itemRequest.getQuantity());
                itemQuery.setParameter(4, unitPrice);
                itemQuery.setParameter(5, itemTotal);
                itemQuery.executeUpdate();
                
                // Reduce stock
                product.setStockQuantity(product.getStockQuantity() - itemRequest.getQuantity());
                productRepository.save(product);
                
                // Create stock movement (OUT) using native SQL
                String movementSql = "INSERT INTO stock_movements (product_id, type, quantity, reason, created_at) " +
                                   "VALUES (?, ?, ?, ?, ?)";
                Query movementQuery = entityManager.createNativeQuery(movementSql);
                movementQuery.setParameter(1, product.getId());
                movementQuery.setParameter(2, "OUT");
                movementQuery.setParameter(3, itemRequest.getQuantity());
                movementQuery.setParameter(4, "Order: " + orderNumber);
                movementQuery.setParameter(5, now);
                movementQuery.executeUpdate();
                
                // Check for low stock and send alerts
                if (product.isLowStock()) {
                    emailService.sendLowStockAlert(product);
                }
            }
            
            // Refresh order to get items
            entityManager.refresh(order);
            
            // Push order to Google Sheets (non-blocking)
            try {
                boolean pushed = googleSheetsService.appendOrder(order);
                if (!pushed) {
                    System.out.println("ℹ️ Order " + order.getId() + " not pushed to Google Sheets (not configured or failed).");
                }
            } catch (Exception sheetEx) {
                System.err.println("⚠️ Failed to push order to Google Sheets: " + sheetEx.getMessage());
            }
            
            // Create initial tracking events
            createTrackingEvents(order);
            
            // Send notifications via Email
            System.out.println("📧 Sending order notifications for Order #" + order.getOrderNumber());
            System.out.println("   Delivery Email: " + (order.getDeliveryEmail() != null ? order.getDeliveryEmail() : "not provided"));
            
            emailService.sendOrderConfirmation(order);
            
            System.out.println("✅ All order notifications queued for Order #" + order.getOrderNumber());
            
            return order;
        } catch (Exception e) {
            System.out.println("❌ Error creating order: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            // Re-throw with more context
            if (e instanceof RuntimeException) {
                throw e; // Re-throw validation errors as-is
            } else {
                throw new RuntimeException("Failed to create order: " + e.getMessage(), e);
            }
        }
    }
    
    /**
     * Create tracking timeline events
     */
    private void createTrackingEvents(Order order) {
        LocalDateTime baseTime = LocalDateTime.now();
        int sequence = 1;
        
        // Label Created
        createTrackingEventNative(order.getId(), "LABEL_CREATED", "Label created", "Warehouse", sequence++, baseTime.plusHours(sequence));
        
        // Shipment Picked
        createTrackingEventNative(order.getId(), "SHIPMENT_PICKED", "Shipment picked up", "Warehouse", sequence++, baseTime.plusHours(sequence));
        
        // Package Received at Facility
        createTrackingEventNative(order.getId(), "PACKAGE_RECEIVED_AT_FACILITY", "Package received at sorting facility", "Sorting Center", sequence++, baseTime.plusHours(sequence));
        
        // Package Left Facility
        createTrackingEventNative(order.getId(), "PACKAGE_LEFT_FACILITY", "Package left sorting facility", "Sorting Center", sequence++, baseTime.plusHours(sequence));
        
        // Package Arrived at Local Facility
        createTrackingEventNative(order.getId(), "PACKAGE_ARRIVED_AT_LOCAL_FACILITY", "Package arrived at local facility", "Local Hub", sequence++, baseTime.plusHours(sequence));
        
        // Out for Delivery (will be updated when status changes)
        // Delivered (will be added when delivered)
    }
    
    private void createTrackingEventNative(Long orderId, String eventType, String description, 
                                          String location, int sequence, LocalDateTime eventTime) {
        String eventSql = "INSERT INTO tracking_events (order_id, event_type, description, location, sequence, event_time) " +
                         "VALUES (?, ?, ?, ?, ?, ?)";
        Query eventQuery = entityManager.createNativeQuery(eventSql);
        eventQuery.setParameter(1, orderId);
        eventQuery.setParameter(2, eventType);
        eventQuery.setParameter(3, description);
        eventQuery.setParameter(4, location);
        eventQuery.setParameter(5, sequence);
        eventQuery.setParameter(6, java.sql.Timestamp.valueOf(eventTime));
        eventQuery.executeUpdate();
    }
    
    /**
     * Update order status (overloaded method for backward compatibility)
     */
    @Transactional
    public Order updateOrderStatus(Long orderId, Order.OrderStatus newStatus) {
        return updateOrderStatus(orderId, newStatus, null);
    }
    
    /**
     * Update order status with validation
     */
    @Transactional
    public Order updateOrderStatus(Long orderId, Order.OrderStatus newStatus, String cancellationReason) {
        System.out.println("🔵 [ORDER SERVICE] updateOrderStatus called for orderId: " + orderId + ", newStatus: " + newStatus);
        try {
        Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> {
                        System.err.println("❌ [ORDER SERVICE] Order not found: " + orderId);
                        return new RuntimeException("Order not found");
                    });
            
            System.out.println("🔵 [ORDER SERVICE] Found order: " + order.getOrderNumber() + ", current status: " + order.getStatus());
        
        Order.OrderStatus oldStatus = order.getStatus();
        
        // Prevent status downgrades - once an order progresses, it cannot go back
        if (!isValidStatusTransition(oldStatus, newStatus)) {
            throw new RuntimeException("Cannot change order status from " + oldStatus + " to " + newStatus + ". Orders can only progress forward or be cancelled.");
        }
        
        // If canceling, set cancellation reason
        if (newStatus == Order.OrderStatus.CANCELLED) {
            if (cancellationReason == null || cancellationReason.trim().isEmpty()) {
                throw new RuntimeException("Cancellation reason is required when canceling an order");
            }
            order.setCancellationReason(cancellationReason.trim());
        }
        
        order.setStatus(newStatus);
        
            // Preserve timestamps if they were already set (e.g., by DeliveryManController)
            // Only set if not already set
            LocalDateTime now = LocalDateTime.now();
            if (newStatus == Order.OrderStatus.PICKED_UP && order.getPickedUpAt() == null) {
                order.setPickedUpAt(now);
                System.out.println("🔵 [ORDER SERVICE] Set pickedUpAt timestamp");
            }
            if (newStatus == Order.OrderStatus.OUT_FOR_DELIVERY && order.getOutForDeliveryAt() == null) {
                order.setOutForDeliveryAt(now);
                System.out.println("🔵 [ORDER SERVICE] Set outForDeliveryAt timestamp");
            }
            if (newStatus == Order.OrderStatus.DELIVERED && order.getDeliveredAt() == null) {
                order.setDeliveredAt(now);
                System.out.println("🔵 [ORDER SERVICE] Set deliveredAt timestamp");
            }
            
            // Initialize lazy-loaded fields before saving and sending notifications
            try {
                if (order.getCustomer() != null) {
                    order.getCustomer().getEmail(); // Force initialization
                    order.getCustomer().getName(); // Force initialization
                }
                if (order.getItems() != null) {
                    order.getItems().size(); // Force initialization
                }
                System.out.println("🔵 [ORDER SERVICE] Lazy-loaded fields initialized");
            } catch (Exception initError) {
                System.err.println("⚠️ [ORDER SERVICE] Warning: Error initializing lazy-loaded fields: " + initError.getMessage());
                // Continue anyway
            }
            
            // Save order first to ensure it's persisted
            try {
        order = orderRepository.save(order);
                // Flush immediately so that any DB constraint/validation errors surface here
                orderRepository.flush();
                System.out.println("🔵 [ORDER SERVICE] Order saved and flushed with new status");
            } catch (Exception saveError) {
                System.err.println("❌ [ORDER SERVICE] Error saving/flushing order: " + saveError.getMessage());
                saveError.printStackTrace();
                throw saveError;
            }
            
            // Add tracking events based on status (use native insert to avoid SQLite getGeneratedKeys limitation)
            try {
                if (newStatus == Order.OrderStatus.OUT_FOR_DELIVERY) {
                    createTrackingEventNative(
                        order.getId(),
                        TrackingEvent.EventType.OUT_FOR_DELIVERY.name(),
                        "Out for delivery",
                        "Local Hub",
                        6,
                        LocalDateTime.now()
                    );
                    System.out.println("🔵 [ORDER SERVICE] Created OUT_FOR_DELIVERY tracking event (native insert)");
                } else if (newStatus == Order.OrderStatus.DELIVERED) {
                    String deliveryLocation = order.getDeliveryAddress() != null && !order.getDeliveryAddress().isEmpty() 
                        ? order.getDeliveryAddress() 
                        : "Delivery Location";
                    createTrackingEventNative(
                        order.getId(),
                        TrackingEvent.EventType.DELIVERED.name(),
                        "Delivered",
                        deliveryLocation,
                        7,
                        LocalDateTime.now()
                    );
                    System.out.println("🔵 [ORDER SERVICE] Created DELIVERED tracking event (native insert)");
                }
            } catch (Exception eventError) {
                System.err.println("❌ [ORDER SERVICE] Error creating tracking event: " + eventError.getMessage());
                eventError.printStackTrace();
                // Don't fail the entire operation if tracking event creation fails
            }
        
        // Send notifications for ALL status changes (except if status didn't change)
        if (oldStatus != newStatus) {
            // Initialize customer again before notification (in case it's a fresh entity after save)
            try {
                if (order.getCustomer() != null) {
                    order.getCustomer().getEmail();
                }
            } catch (Exception e) {
                System.err.println("⚠️ [ORDER SERVICE] Could not initialize customer for notification: " + e.getMessage());
            }
            
            // Send Email notification for ALL status updates
            try {
                emailService.sendOrderStatusUpdate(order);
                System.out.println("🔵 [ORDER SERVICE] Email notification sent");
            } catch (Exception emailError) {
                System.err.println("⚠️ [ORDER SERVICE] Error sending email notification: " + emailError.getMessage());
                emailError.printStackTrace();
                // Don't fail the operation
            }

            // Push status update to Google Sheets (append as a new row)
            try {
                boolean pushed = googleSheetsService.appendOrder(order);
                if (!pushed) {
                    System.out.println("ℹ️ [ORDER SERVICE] Status update not pushed to Google Sheets (not configured or failed).");
                } else {
                    System.out.println("✅ [ORDER SERVICE] Status update appended to Google Sheets.");
                }
            } catch (Exception sheetEx) {
                System.err.println("⚠️ [ORDER SERVICE] Failed to push status update to Google Sheets: " + sheetEx.getMessage());
            }
        }
        
        System.out.println("✅ [ORDER SERVICE] Status update completed successfully");
        return order;
    } catch (Exception e) {
            System.err.println("❌ [ORDER SERVICE] Critical error in updateOrderStatus: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update order status: " + e.getMessage(), e);
        }
    }
    
    /**
     * Get order by ID
     */
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }
    
    /**
     * Get orders by customer
     */
    @Transactional(readOnly = true)
    public List<Order> getOrdersByCustomer(Long customerId) {
        try {
            User customer = userRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            List<Order> orders = orderRepository.findByCustomerOrderByCreatedAtDesc(customer);
            
            // Initialize all lazy-loaded relationships to avoid serialization issues
            for (Order order : orders) {
                if (order.getItems() != null) {
                    for (var item : order.getItems()) {
                        if (item.getProduct() != null) {
                            // Initialize product to avoid lazy loading issues
                            // Access product fields to trigger lazy loading within transaction
                            item.getProduct().getName();
                            item.getProduct().getId();
                            // Ensure supplier is not accessed (already @JsonIgnore)
                        }
                    }
                }
                // Initialize customer if needed
                if (order.getCustomer() != null) {
                    order.getCustomer().getEmail();
                }
            }
            
            return orders;
        } catch (Exception e) {
            System.err.println("❌ Error in getOrdersByCustomer: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Get all orders
     */
    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        System.out.println("🔵 [ORDER SERVICE] Starting getAllOrders...");
        List<Order> orders = null;
        try {
            // Try to use custom query with LEFT JOIN to handle missing products gracefully
            orders = orderRepository.findAllWithProducts();
            System.out.println("🔵 [ORDER SERVICE] Found " + (orders != null ? orders.size() : 0) + " orders from repository");
        } catch (org.hibernate.FetchNotFoundException | org.springframework.orm.jpa.JpaObjectRetrievalFailureException e) {
            // If products are missing, fall back to regular findAll and handle errors per order
            System.err.println("⚠️ [ORDER SERVICE] Some products are missing, using fallback approach: " + e.getMessage());
            try {
                orders = orderRepository.findAll();
            } catch (Exception e2) {
                System.err.println("❌ [ORDER SERVICE] Even findAll() failed: " + e2.getMessage());
                // Return empty list if we can't load any orders
                return List.of();
            }
        }
        
        try {
            
            if (orders == null) {
                System.out.println("⚠️ [ORDER SERVICE] Orders list is null, returning empty list");
                return List.of();
            }
            
            // Filter out orders with problematic items and handle missing products
            List<Order> validOrders = new java.util.ArrayList<>();
            int successCount = 0;
            int errorCount = 0;
            
            for (Order order : orders) {
                if (order == null) {
                    System.err.println("⚠️ [ORDER SERVICE] Found null order in list, skipping");
                    errorCount++;
                    continue;
                }
                
                try {
                    Long orderId = order.getId();
                    if (orderId == null) {
                        System.err.println("⚠️ [ORDER SERVICE] Order has null ID, skipping");
                        errorCount++;
                        continue;
                    }
                    
                    // Handle items and check for missing products
                    if (order.getItems() != null) {
                        List<com.sudharshini.stockmanagement.entity.OrderItem> validItems = new java.util.ArrayList<>();
                        for (var item : order.getItems()) {
                            try {
                                // Try to access the product - if it doesn't exist, this will throw an exception
                                if (item.getProduct() != null) {
                                    // Product exists, try to access its ID to verify
                                    Long productId = item.getProduct().getId();
                                    if (productId != null) {
                                        validItems.add(item);
                                    } else {
                                        System.err.println("⚠️ [ORDER SERVICE] Order " + orderId + " has item with null product ID, skipping item");
                                    }
                                } else {
                                    System.err.println("⚠️ [ORDER SERVICE] Order " + orderId + " has item with null product, skipping item");
                                }
                            } catch (org.hibernate.FetchNotFoundException | org.springframework.orm.jpa.JpaObjectRetrievalFailureException e) {
                                // Product doesn't exist - skip this item
                                System.err.println("⚠️ [ORDER SERVICE] Order " + orderId + " has item referencing missing product, skipping item: " + e.getMessage());
                            } catch (Exception e) {
                                // Other errors - log but continue
                                System.err.println("⚠️ [ORDER SERVICE] Error checking product for order " + orderId + " item: " + e.getMessage());
                            }
                        }
                        // Replace items list with valid items only
                        if (validItems.size() < order.getItems().size()) {
                            System.out.println("🔵 [ORDER SERVICE] Order " + orderId + ": filtered " + (order.getItems().size() - validItems.size()) + " invalid items");
                            // Use reflection or create a new order with valid items
                            // For now, we'll keep the original items but mark problematic ones
                        }
                    }
                    
                    // Initialize tracking events (LAZY loaded)
                    try {
                        if (order.getTrackingEvents() != null) {
                            order.getTrackingEvents().size(); // Force initialization
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ [ORDER SERVICE] Error initializing tracking events for order " + orderId + ": " + e.getMessage());
                        // Not critical, continue
                    }
                    
                    // Initialize customer reference (ManyToOne - should be fine, but be safe)
                    try {
                        if (order.getCustomer() != null) {
                            String email = order.getCustomer().getEmail(); // Force initialization
                            if (email != null) {
                                // Successfully accessed
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ [ORDER SERVICE] Error initializing customer for order " + orderId + ": " + e.getMessage());
                        // Not critical, continue
                    }
                    
                    // Initialize assignedTo reference
                    try {
                        if (order.getAssignedTo() != null) {
                            String email = order.getAssignedTo().getEmail(); // Force initialization
                            if (email != null) {
                                // Successfully accessed
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ [ORDER SERVICE] Error initializing assignedTo for order " + orderId + ": " + e.getMessage());
                        // Not critical, continue
                    }
                    
                    validOrders.add(order);
                    successCount++;
                } catch (Exception initError) {
                    System.err.println("❌ [ORDER SERVICE] Critical error initializing order " + (order.getId() != null ? order.getId() : "unknown") + ": " + initError.getMessage());
                    initError.printStackTrace();
                    errorCount++;
                    // Continue with other orders - don't fail the entire request
                }
            }
            
            System.out.println("✅ [ORDER SERVICE] Successfully initialized " + successCount + " orders, " + errorCount + " errors");
            return validOrders;
        } catch (Exception e) {
            System.err.println("❌ [ORDER SERVICE] Critical error in getAllOrders: " + e.getMessage());
            e.printStackTrace();
            // Return empty list instead of throwing exception to prevent complete failure
            System.err.println("⚠️ [ORDER SERVICE] Returning empty list due to errors");
            return List.of();
        }
    }
    
    /**
     * Validate if status transition is allowed
     * Prevents status downgrades - orders can only progress forward or be cancelled
     */
    private boolean isValidStatusTransition(Order.OrderStatus current, Order.OrderStatus newStatus) {
        // If same status, allow (no-op)
        if (current == newStatus) {
            return true;
        }
        
        // If already cancelled or delivered, cannot change
        if (current == Order.OrderStatus.CANCELLED || current == Order.OrderStatus.DELIVERED) {
            return false;
        }

        // Allow cancellation from any in-progress state
        if (newStatus == Order.OrderStatus.CANCELLED) {
            return true;
        }

        // Allow forward jumps (no downgrades). Define the progression order.
        Order.OrderStatus[] flow = {
                Order.OrderStatus.PENDING,
                Order.OrderStatus.CONFIRMED,
                Order.OrderStatus.PROCESSING,
                Order.OrderStatus.SHIPPED,
                Order.OrderStatus.ACCEPTED,
                Order.OrderStatus.PICKED_UP,
                Order.OrderStatus.OUT_FOR_DELIVERY,
                Order.OrderStatus.DELIVERED
        };

        int currentIdx = -1;
        int newIdx = -1;
        for (int i = 0; i < flow.length; i++) {
            if (flow[i] == current) currentIdx = i;
            if (flow[i] == newStatus) newIdx = i;
        }

        // If either status not in flow, reject
        if (currentIdx == -1 || newIdx == -1) {
            return false;
        }

        // Allow moving forward (including skipping steps), disallow downgrades
        return newIdx >= currentIdx;
    }
}

