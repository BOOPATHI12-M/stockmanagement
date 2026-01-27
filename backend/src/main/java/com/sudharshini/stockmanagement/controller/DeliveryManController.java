package com.sudharshini.stockmanagement.controller;

import com.sudharshini.stockmanagement.entity.LocationTracking;
import com.sudharshini.stockmanagement.entity.Order;
import com.sudharshini.stockmanagement.entity.User;
import com.sudharshini.stockmanagement.repository.LocationTrackingRepository;
import com.sudharshini.stockmanagement.repository.OrderRepository;
import com.sudharshini.stockmanagement.repository.UserRepository;
import com.sudharshini.stockmanagement.service.EmailService;
import com.sudharshini.stockmanagement.service.OrderService;
import com.sudharshini.stockmanagement.util.JwtUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Delivery Man Controller
 * Handles delivery man operations
 */
@RestController
@RequestMapping("/api/delivery")
public class DeliveryManController {
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private LocationTrackingRepository locationTrackingRepository;
    
    /**
     * Get all orders assigned to the current delivery man
     */
    @GetMapping("/my-orders")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyOrders() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String identifier = authentication.getName(); // Could be email or username
            
            // Try to find user by email first, then by username
            User deliveryMan = userRepository.findByEmail(identifier)
                    .orElse(userRepository.findByUsername(identifier)
                            .orElseThrow(() -> new RuntimeException("Delivery man not found")));
            
            if (deliveryMan.getRole() != User.UserRole.DELIVERY_MAN) {
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Delivery man role required."));
            }
            
            List<Order> orders = orderRepository.findByAssignedTo(deliveryMan);
            
            // Initialize lazy-loaded collections to avoid LazyInitializationException
            for (Order order : orders) {
                try {
                    if (order.getItems() != null) {
                        order.getItems().size(); // Force initialization
                        // Also initialize product references in items
                        order.getItems().forEach(item -> {
                            if (item.getProduct() != null) {
                                item.getProduct().getName(); // Force initialization
                            }
                        });
                    }
                    if (order.getTrackingEvents() != null) {
                        order.getTrackingEvents().size(); // Force initialization
                    }
                    // Initialize customer reference
                    if (order.getCustomer() != null) {
                        order.getCustomer().getEmail(); // Force initialization
                    }
                    // Initialize assignedTo reference
                    if (order.getAssignedTo() != null) {
                        order.getAssignedTo().getEmail(); // Force initialization
                    }
                } catch (Exception initError) {
                    System.err.println("⚠️ Warning: Error initializing order " + order.getId() + ": " + initError.getMessage());
                    // Continue with other orders
                }
            }
            
            // Build safe response list without lazy-loaded issues
            List<Map<String, Object>> orderList = new java.util.ArrayList<>();
            for (Order order : orders) {
                try {
                    Map<String, Object> orderMap = buildOrderMap(order);
                    orderList.add(orderMap);
                } catch (Exception e) {
                    System.err.println("⚠️ Error building order map for order " + order.getId() + ": " + e.getMessage());
                    // Skip this order but continue with others
                }
            }
            
            return ResponseEntity.ok(orderList);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ Error fetching my orders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch orders: " + e.getMessage()));
        }
    }
    
    /**
     * Get all available orders (not yet assigned)
     */
    @GetMapping("/available-orders")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getAvailableOrders() {
        try {
            List<Order> orders = orderRepository.findByAssignedToIsNullAndStatusIn(
                List.of(Order.OrderStatus.CONFIRMED, Order.OrderStatus.PROCESSING)
            );
            
            // Initialize lazy-loaded collections to avoid LazyInitializationException
            for (Order order : orders) {
                try {
                    if (order.getItems() != null) {
                        order.getItems().size(); // Force initialization
                        // Also initialize product references in items
                        order.getItems().forEach(item -> {
                            if (item.getProduct() != null) {
                                item.getProduct().getName(); // Force initialization
                            }
                        });
                    }
                    if (order.getTrackingEvents() != null) {
                        order.getTrackingEvents().size(); // Force initialization
                    }
                    // Initialize customer reference
                    if (order.getCustomer() != null) {
                        order.getCustomer().getEmail(); // Force initialization
                    }
                } catch (Exception initError) {
                    System.err.println("⚠️ Warning: Error initializing order " + order.getId() + ": " + initError.getMessage());
                    // Continue with other orders
                }
            }
            
            // Build safe response list without lazy-loaded issues
            List<Map<String, Object>> orderList = new java.util.ArrayList<>();
            for (Order order : orders) {
                try {
                    Map<String, Object> orderMap = buildOrderMap(order);
                    orderList.add(orderMap);
                } catch (Exception e) {
                    System.err.println("⚠️ Error building order map for order " + order.getId() + ": " + e.getMessage());
                    // Skip this order but continue with others
                }
            }
            
            return ResponseEntity.ok(orderList);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ Error fetching available orders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch available orders: " + e.getMessage()));
        }
    }
    
    /**
     * Accept an order (assign to delivery man)
     */
    @PostMapping("/orders/{orderId}/accept")
    @Transactional
    public ResponseEntity<?> acceptOrder(@PathVariable Long orderId) {
        System.out.println("🔵 [ACCEPT ORDER] Starting accept order for orderId: " + orderId);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null) {
                System.err.println("❌ [ACCEPT ORDER] Authentication is null");
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            
            String identifier = authentication.getName(); // Could be email or username
            System.out.println("🔵 [ACCEPT ORDER] Authenticated user identifier: " + identifier);
            
            // Try to find user by email first, then by username
            User deliveryMan = userRepository.findByEmail(identifier)
                    .orElse(userRepository.findByUsername(identifier)
                            .orElseThrow(() -> {
                                System.err.println("❌ [ACCEPT ORDER] Delivery man not found for identifier: " + identifier);
                                return new RuntimeException("Delivery man not found");
                            }));
            
            System.out.println("🔵 [ACCEPT ORDER] Found delivery man: " + deliveryMan.getUsername() + " (Role: " + deliveryMan.getRole() + ")");
            
            if (deliveryMan.getRole() != User.UserRole.DELIVERY_MAN) {
                System.err.println("❌ [ACCEPT ORDER] Access denied - user is not a delivery man");
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Delivery man role required."));
            }
            
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> {
                        System.err.println("❌ [ACCEPT ORDER] Order not found: " + orderId);
                        return new RuntimeException("Order not found");
                    });
            
            System.out.println("🔵 [ACCEPT ORDER] Found order: " + order.getOrderNumber() + " (Status: " + order.getStatus() + ")");
            
            if (order.getAssignedTo() != null) {
                System.err.println("❌ [ACCEPT ORDER] Order already assigned to: " + order.getAssignedTo().getUsername());
                return ResponseEntity.status(400).body(Map.of("error", "Order is already assigned to another delivery man"));
            }
            
            // Assign order to delivery man
            System.out.println("🔵 [ACCEPT ORDER] Assigning order to delivery man...");
            order.setAssignedTo(deliveryMan);
            order.setStatus(Order.OrderStatus.ACCEPTED);
            order.setAcceptedAt(LocalDateTime.now());
            final Order savedOrder = orderRepository.save(order);
            System.out.println("🔵 [ACCEPT ORDER] Order saved successfully");
            
            // Initialize lazy-loaded collections before returning
            System.out.println("🔵 [ACCEPT ORDER] Initializing lazy-loaded collections...");
            try {
                if (savedOrder.getItems() != null) {
                    savedOrder.getItems().size(); // Force initialization
                    // Also initialize product references in items
                    savedOrder.getItems().forEach(item -> {
                        if (item.getProduct() != null) {
                            item.getProduct().getName(); // Force initialization
                        }
                    });
                }
                if (savedOrder.getTrackingEvents() != null) {
                    savedOrder.getTrackingEvents().size(); // Force initialization
                }
                
                // Initialize customer reference if needed
                if (savedOrder.getCustomer() != null) {
                    savedOrder.getCustomer().getEmail(); // Force initialization
                }
                
                // CRITICAL: Initialize assignedTo relationship before sending notifications
                // The async notification methods will access order.getAssignedTo().getName()
                if (savedOrder.getAssignedTo() != null) {
                    savedOrder.getAssignedTo().getName(); // Force initialization
                    savedOrder.getAssignedTo().getEmail(); // Force initialization
                }
                System.out.println("🔵 [ACCEPT ORDER] Lazy-loaded collections initialized");
            } catch (Exception initError) {
                System.err.println("❌ [ACCEPT ORDER] Error initializing lazy-loaded collections: " + initError.getMessage());
                initError.printStackTrace();
                throw initError;
            }
            
            // Build response FIRST before any async operations
            System.out.println("🔵 [ACCEPT ORDER] Building response...");
            Map<String, Object> response = new HashMap<>();
            try {
                response.put("message", "Order accepted successfully");
                response.put("orderId", savedOrder.getId());
                response.put("orderNumber", savedOrder.getOrderNumber() != null ? savedOrder.getOrderNumber() : "");
                response.put("status", savedOrder.getStatus() != null ? savedOrder.getStatus().name() : "ACCEPTED");
                response.put("acceptedAt", savedOrder.getAcceptedAt() != null ? savedOrder.getAcceptedAt().toString() : LocalDateTime.now().toString());
                System.out.println("🔵 [ACCEPT ORDER] Response built successfully");
            } catch (Exception responseError) {
                System.err.println("❌ [ACCEPT ORDER] Error building response: " + responseError.getMessage());
                responseError.printStackTrace();
                throw responseError;
            }
            
            System.out.println("✅ [ACCEPT ORDER] Order " + orderId + " accepted successfully by delivery man: " + deliveryMan.getUsername());
            
            // Flush to ensure order is persisted
            System.out.println("🔵 [ACCEPT ORDER] Flushing to database...");
            try {
                orderRepository.flush();
                System.out.println("🔵 [ACCEPT ORDER] Flush completed");
            } catch (Exception flushError) {
                System.err.println("❌ [ACCEPT ORDER] Error flushing: " + flushError.getMessage());
                flushError.printStackTrace();
                // Don't fail if flush fails - order is already saved
            }
            
            // Send notifications AFTER building response (fire-and-forget)
            // These are @Async methods, so they run in separate threads
            // We initialize all lazy-loaded fields above to prevent LazyInitializationException
            // The response is already built, so any exceptions in notifications won't affect it
            System.out.println("🔵 [ACCEPT ORDER] Queuing notifications...");
            final Order orderForNotifications = savedOrder; // Make final for lambda
            try {
                emailService.sendOrderStatusUpdate(orderForNotifications);
                System.out.println("🔵 [ACCEPT ORDER] Notifications queued successfully");
            } catch (Exception notificationError) {
                System.err.println("⚠️  [ACCEPT ORDER] Error queuing notifications (non-critical): " + notificationError.getMessage());
                notificationError.printStackTrace();
                // Don't fail the request if notifications fail - they're async anyway
            }
            
            System.out.println("✅ [ACCEPT ORDER] Returning success response");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.err.println("❌ [ACCEPT ORDER] RuntimeException: " + e.getMessage());
            e.printStackTrace();
            System.err.println("❌ [ACCEPT ORDER] Stack trace:");
            for (StackTraceElement element : e.getStackTrace()) {
                System.err.println("   at " + element.toString());
            }
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Unknown error occurred";
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to accept order: " + errorMessage);
            errorResponse.put("exceptionType", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(errorResponse);
        } catch (Exception e) {
            System.err.println("❌ [ACCEPT ORDER] Unexpected Exception: " + e.getMessage());
            e.printStackTrace();
            System.err.println("❌ [ACCEPT ORDER] Stack trace:");
            for (StackTraceElement element : e.getStackTrace()) {
                System.err.println("   at " + element.toString());
            }
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Unknown error occurred";
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to accept order: " + errorMessage);
            errorResponse.put("exceptionType", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
    
    /**
     * Update order status (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
     */
    @PostMapping("/orders/{orderId}/update-status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody(required = false) Map<String, String> request) {
        System.out.println("🔵 [UPDATE STATUS] ========================================");
        System.out.println("🔵 [UPDATE STATUS] Starting status update for orderId: " + orderId);
        System.out.println("🔵 [UPDATE STATUS] Request body: " + (request != null ? request.toString() : "null"));
        
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null) {
                System.err.println("❌ [UPDATE STATUS] Authentication is null");
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            
            String identifier = authentication.getName(); // Could be email or username
            System.out.println("🔵 [UPDATE STATUS] Authenticated user identifier: " + identifier);
            
            // Try to find user by email first, then by username
            User deliveryMan = userRepository.findByEmail(identifier)
                    .orElse(userRepository.findByUsername(identifier)
                            .orElseThrow(() -> {
                                System.err.println("❌ [UPDATE STATUS] Delivery man not found for identifier: " + identifier);
                                return new RuntimeException("Delivery man not found");
                            }));
            
            System.out.println("🔵 [UPDATE STATUS] Found delivery man: " + deliveryMan.getUsername() + " (Role: " + deliveryMan.getRole() + ")");
            
            if (deliveryMan.getRole() != User.UserRole.DELIVERY_MAN) {
                System.err.println("❌ [UPDATE STATUS] Access denied - user is not a delivery man");
                return ResponseEntity.status(403).body(Map.of("error", "Access denied. Delivery man role required."));
            }
            
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> {
                        System.err.println("❌ [UPDATE STATUS] Order not found: " + orderId);
                        return new RuntimeException("Order not found");
                    });
            
            System.out.println("🔵 [UPDATE STATUS] Found order: " + order.getOrderNumber() + " (Current Status: " + order.getStatus() + ")");
            
            // Verify order is assigned to this delivery man
            if (order.getAssignedTo() == null || !order.getAssignedTo().getId().equals(deliveryMan.getId())) {
                System.err.println("❌ [UPDATE STATUS] Order is not assigned to this delivery man");
                return ResponseEntity.status(403).body(Map.of("error", "Order is not assigned to you"));
            }
            
            // Handle null request body
            if (request == null) {
                System.err.println("❌ [UPDATE STATUS] Request body is null");
                return ResponseEntity.status(400).body(Map.of("error", "Request body is required"));
            }
            
            String statusStr = request.get("status");
            if (statusStr == null || statusStr.isEmpty()) {
                System.err.println("❌ [UPDATE STATUS] Status is missing in request");
                System.err.println("❌ [UPDATE STATUS] Request keys: " + request.keySet());
                return ResponseEntity.status(400).body(Map.of("error", "Status is required"));
            }
            
            System.out.println("🔵 [UPDATE STATUS] Requested status: " + statusStr);
            
            Order.OrderStatus newStatus;
            try {
                newStatus = Order.OrderStatus.valueOf(statusStr);
            } catch (IllegalArgumentException e) {
                System.err.println("❌ [UPDATE STATUS] Invalid status value: " + statusStr);
                return ResponseEntity.status(400).body(Map.of("error", "Invalid status: " + statusStr));
            }
            
            // Validate status transition
            if (!isValidStatusTransition(order.getStatus(), newStatus)) {
                System.err.println("❌ [UPDATE STATUS] Invalid status transition from " + order.getStatus() + " to " + newStatus);
                return ResponseEntity.status(400).body(Map.of(
                    "error", "Invalid status transition",
                    "currentStatus", order.getStatus(),
                    "requestedStatus", newStatus
                ));
            }
            
            System.out.println("🔵 [UPDATE STATUS] Status transition is valid, initializing order fields...");
            
            // Initialize lazy-loaded collections BEFORE calling service to avoid issues
            try {
                if (order.getItems() != null) {
                    order.getItems().size(); // Force initialization
                }
                if (order.getCustomer() != null) {
                    order.getCustomer().getEmail(); // Force initialization
                    order.getCustomer().getName(); // Force initialization
                }
                if (order.getAssignedTo() != null) {
                    order.getAssignedTo().getName(); // Force initialization
                    order.getAssignedTo().getEmail(); // Force initialization
                }
                // Initialize delivery address if needed (for DELIVERED status tracking event)
                if (order.getDeliveryAddress() != null) {
                    order.getDeliveryAddress().length(); // Force initialization
                }
                System.out.println("🔵 [UPDATE STATUS] Order fields initialized");
            } catch (Exception initError) {
                System.err.println("⚠️ [UPDATE STATUS] Warning: Error initializing order fields: " + initError.getMessage());
                initError.printStackTrace();
                // Continue anyway - might still work
            }
            
            System.out.println("🔵 [UPDATE STATUS] Calling OrderService.updateOrderStatus...");
            
            // Update via OrderService - it will handle status, timestamps, tracking events, and notifications
            try {
                System.out.println("🔵 [UPDATE STATUS] About to call orderService.updateOrderStatus...");
                Order updatedOrder = orderService.updateOrderStatus(orderId, newStatus);
                System.out.println("✅ [UPDATE STATUS] OrderService.updateOrderStatus returned successfully");
                
                // Return a simple success response immediately - don't access the order object after transaction
                try {
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Order status updated successfully");
                    response.put("orderId", orderId);
                    response.put("status", newStatus.toString());
                    
                    System.out.println("✅ [UPDATE STATUS] Success response built, returning...");
                    ResponseEntity<?> result = ResponseEntity.ok(response);
                    System.out.println("✅ [UPDATE STATUS] Response entity created successfully");
                    return result;
                } catch (Exception responseError) {
                    System.err.println("❌ [UPDATE STATUS] Error building response: " + responseError.getMessage());
                    responseError.printStackTrace();
                    // Fallback: return minimal response
                    return ResponseEntity.ok(Map.of(
                        "message", "Order status updated",
                        "orderId", orderId.toString(),
                        "status", newStatus.toString()
                    ));
                }
                
            } catch (Exception serviceError) {
                System.err.println("❌ [UPDATE STATUS] ========================================");
                System.err.println("❌ [UPDATE STATUS] Error in OrderService.updateOrderStatus");
                System.err.println("❌ [UPDATE STATUS] Exception type: " + serviceError.getClass().getName());
                System.err.println("❌ [UPDATE STATUS] Exception message: " + serviceError.getMessage());
                if (serviceError.getCause() != null) {
                    System.err.println("❌ [UPDATE STATUS] Exception cause: " + serviceError.getCause().getMessage());
                    System.err.println("❌ [UPDATE STATUS] Exception cause type: " + serviceError.getCause().getClass().getName());
                }
                System.err.println("❌ [UPDATE STATUS] Stack trace:");
                serviceError.printStackTrace();
                System.err.println("❌ [UPDATE STATUS] ========================================");
                
                // Try to get the error message safely
                String errorMessage = serviceError.getMessage();
                if (errorMessage == null || errorMessage.isEmpty()) {
                    errorMessage = "Unknown error occurred: " + serviceError.getClass().getSimpleName();
                }
                
                // If there is a root cause (e.g., constraint violation), include it
                if (serviceError.getCause() != null) {
                    errorMessage += " | Cause: " + serviceError.getCause().getClass().getSimpleName() + " - " + serviceError.getCause().getMessage();
                }
                
                // If there's a cause, include it in the message
                if (serviceError.getCause() != null && serviceError.getCause().getMessage() != null) {
                    errorMessage += " (Cause: " + serviceError.getCause().getMessage() + ")";
                }
                
                return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to update order status: " + errorMessage,
                    "exceptionType", serviceError.getClass().getSimpleName()
                ));
            }
        } catch (IllegalArgumentException e) {
            System.err.println("❌ [UPDATE STATUS] IllegalArgumentException: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(400).body(Map.of("error", "Invalid request: " + e.getMessage()));
        } catch (RuntimeException e) {
            System.err.println("❌ [UPDATE STATUS] RuntimeException: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update order status: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ [UPDATE STATUS] ========================================");
            System.err.println("❌ [UPDATE STATUS] Unexpected Exception: " + e.getMessage());
            System.err.println("❌ [UPDATE STATUS] Exception type: " + e.getClass().getName());
            System.err.println("❌ [UPDATE STATUS] Exception cause: " + (e.getCause() != null ? e.getCause().getMessage() : "none"));
            e.printStackTrace();
            System.err.println("❌ [UPDATE STATUS] ========================================");
            
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = "Unknown error: " + e.getClass().getSimpleName();
            }
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to update order status: " + errorMessage,
                "exceptionType", e.getClass().getSimpleName()
            ));
        } finally {
            System.out.println("🔵 [UPDATE STATUS] Method execution completed for orderId: " + orderId);
        }
    }
    
    /**
     * Update delivery man's current location
     */
    @PostMapping("/orders/{orderId}/update-location")
    @Transactional
    public ResponseEntity<?> updateLocation(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> locationData) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String identifier = authentication.getName(); // Could be email or username
            
            // Try to find user by email first, then by username
            User deliveryMan = userRepository.findByEmail(identifier)
                    .orElse(userRepository.findByUsername(identifier)
                            .orElseThrow(() -> new RuntimeException("Delivery man not found")));
            
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            // Verify order is assigned to this delivery man
            if (order.getAssignedTo() == null || !order.getAssignedTo().getId().equals(deliveryMan.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Order is not assigned to you"));
            }
            
            // Extract location data
            Double latitude = null;
            Double longitude = null;
            
            if (locationData.get("lat") instanceof Number) {
                latitude = ((Number) locationData.get("lat")).doubleValue();
            } else if (locationData.get("latitude") instanceof Number) {
                latitude = ((Number) locationData.get("latitude")).doubleValue();
            }
            
            if (locationData.get("lng") instanceof Number) {
                longitude = ((Number) locationData.get("lng")).doubleValue();
            } else if (locationData.get("longitude") instanceof Number) {
                longitude = ((Number) locationData.get("longitude")).doubleValue();
            }
            
            if (latitude == null || longitude == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Latitude and longitude are required"));
            }
            
            String address = (String) locationData.getOrDefault("address", "");
            Double accuracy = locationData.get("accuracy") != null ? 
                ((Number) locationData.get("accuracy")).doubleValue() : null;
            Double speed = locationData.get("speed") != null ? 
                ((Number) locationData.get("speed")).doubleValue() : null;
            Double heading = locationData.get("heading") != null ? 
                ((Number) locationData.get("heading")).doubleValue() : null;
            
            LocalDateTime timestamp = LocalDateTime.now();
            
            // Store location as JSON string in order
            String locationJson = String.format(
                "{\"lat\": %.6f, \"lng\": %.6f, \"timestamp\": \"%s\", \"address\": \"%s\"}",
                latitude,
                longitude,
                timestamp,
                address
            );
            
            order.setCurrentLocation(locationJson);
            order = orderRepository.save(order);
            
            // Store location in tracking history
            LocationTracking locationTracking = new LocationTracking();
            locationTracking.setOrder(order);
            locationTracking.setLatitude(latitude);
            locationTracking.setLongitude(longitude);
            locationTracking.setAddress(address);
            locationTracking.setAccuracy(accuracy);
            locationTracking.setSpeed(speed);
            locationTracking.setHeading(heading);
            locationTracking.setTimestamp(timestamp);
            locationTrackingRepository.save(locationTracking);
            
            return ResponseEntity.ok(Map.of(
                "message", "Location updated successfully",
                "location", Map.of(
                    "lat", latitude,
                    "lng", longitude,
                    "timestamp", timestamp.toString(),
                    "address", address
                )
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update location: " + e.getMessage()));
        }
    }
    
    /**
     * Generate fake location data for testing
     * Creates a simulated delivery route from pickup to delivery location
     */
    @PostMapping("/orders/{orderId}/generate-fake-locations")
    public ResponseEntity<?> generateFakeLocations(@PathVariable Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            if (order.getAssignedTo() == null) {
                return ResponseEntity.status(400).body(Map.of(
                    "error", "Order must be assigned to a delivery man first"
                ));
            }
            
            // Parse pickup and delivery locations
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> pickupLocation = null;
            Map<String, Object> deliveryLocation = null;
            
            try {
                if (order.getPickupLocation() != null && !order.getPickupLocation().isEmpty()) {
                    pickupLocation = objectMapper.readValue(order.getPickupLocation(), Map.class);
                }
                if (order.getDeliveryLocation() != null && !order.getDeliveryLocation().isEmpty()) {
                    deliveryLocation = objectMapper.readValue(order.getDeliveryLocation(), Map.class);
                }
            } catch (Exception e) {
                System.err.println("Error parsing locations: " + e.getMessage());
            }
            
            // Default locations (Bangalore area) if not set
            double pickupLat = 12.9716;
            double pickupLng = 77.5946;
            double deliveryLat = 12.9352;
            double deliveryLng = 77.6245;
            
            if (pickupLocation != null) {
                pickupLat = ((Number) pickupLocation.getOrDefault("lat", 12.9716)).doubleValue();
                pickupLng = ((Number) pickupLocation.getOrDefault("lng", 77.5946)).doubleValue();
            }
            
            if (deliveryLocation != null) {
                deliveryLat = ((Number) deliveryLocation.getOrDefault("lat", 12.9352)).doubleValue();
                deliveryLng = ((Number) deliveryLocation.getOrDefault("lng", 77.6245)).doubleValue();
            }
            
            // Generate 10 intermediate points along the route
            int numPoints = 10;
            LocalDateTime baseTime = LocalDateTime.now().minusMinutes(30);
            List<Map<String, Object>> generatedLocations = new java.util.ArrayList<>();
            
            for (int i = 0; i <= numPoints; i++) {
                double progress = (double) i / numPoints;
                double lat = pickupLat + (deliveryLat - pickupLat) * progress;
                double lng = pickupLng + (deliveryLng - pickupLng) * progress;
                
                // Add some random variation to simulate real GPS movement
                double latVariation = (Math.random() - 0.5) * 0.001; // ~100m variation
                double lngVariation = (Math.random() - 0.5) * 0.001;
                lat += latVariation;
                lng += lngVariation;
                
                LocalDateTime timestamp = baseTime.plusMinutes(i * 3); // 3 minutes between points
                
                // Create location tracking entry
                LocationTracking locationTracking = new LocationTracking();
                locationTracking.setOrder(order);
                locationTracking.setLatitude(lat);
                locationTracking.setLongitude(lng);
                locationTracking.setAddress(String.format("Location %d on route", i + 1));
                locationTracking.setAccuracy(10.0 + Math.random() * 20.0); // 10-30 meters accuracy
                locationTracking.setSpeed(8.0 + Math.random() * 12.0); // 8-20 m/s (roughly 30-70 km/h)
                locationTracking.setHeading(Math.random() * 360.0); // Random heading
                locationTracking.setTimestamp(timestamp);
                locationTrackingRepository.save(locationTracking);
                
                // Store as current location if it's the last point
                if (i == numPoints) {
                    String locationJson = String.format(
                        "{\"lat\": %.6f, \"lng\": %.6f, \"timestamp\": \"%s\", \"address\": \"%s\"}",
                        lat, lng, timestamp, "Near delivery location"
                    );
                    order.setCurrentLocation(locationJson);
                    orderRepository.save(order);
                }
                
                Map<String, Object> loc = new HashMap<>();
                loc.put("lat", lat);
                loc.put("lng", lng);
                loc.put("timestamp", timestamp.toString());
                loc.put("address", String.format("Location %d on route", i + 1));
                generatedLocations.add(loc);
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "Fake location data generated successfully",
                "count", generatedLocations.size(),
                "locations", generatedLocations,
                "pickup", Map.of("lat", pickupLat, "lng", pickupLng),
                "delivery", Map.of("lat", deliveryLat, "lng", deliveryLng)
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate fake locations: " + e.getMessage()));
        }
    }
    
    /**
     * Get order details with location information
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<?> getOrderDetails(@PathVariable Long orderId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String identifier = authentication.getName(); // Could be email or username
            
            // Try to find user by email first, then by username
            User deliveryMan = userRepository.findByEmail(identifier)
                    .orElse(userRepository.findByUsername(identifier)
                            .orElseThrow(() -> new RuntimeException("Delivery man not found")));
            
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            // Verify order is assigned to this delivery man or user is admin
            if (deliveryMan.getRole() != User.UserRole.ADMIN) {
                if (order.getAssignedTo() == null || !order.getAssignedTo().getId().equals(deliveryMan.getId())) {
                    return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
                }
            }
            
            Map<String, Object> orderDetails = new HashMap<>();
            orderDetails.put("order", order);
            orderDetails.put("pickupLocation", order.getPickupLocation());
            orderDetails.put("deliveryLocation", order.getDeliveryLocation());
            orderDetails.put("currentLocation", order.getCurrentLocation());
            
            return ResponseEntity.ok(orderDetails);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch order details: " + e.getMessage()));
        }
    }
    
    /**
     * Validate status transition
     */
    private boolean isValidStatusTransition(Order.OrderStatus current, Order.OrderStatus newStatus) {
        // Define valid transitions
        return switch (current) {
            case CONFIRMED, PROCESSING -> newStatus == Order.OrderStatus.ACCEPTED || newStatus == Order.OrderStatus.CANCELLED;
            case ACCEPTED -> newStatus == Order.OrderStatus.PICKED_UP || newStatus == Order.OrderStatus.CANCELLED;
            case PICKED_UP -> newStatus == Order.OrderStatus.OUT_FOR_DELIVERY || newStatus == Order.OrderStatus.CANCELLED;
            case OUT_FOR_DELIVERY -> newStatus == Order.OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false; // Final states
            default -> false;
        };
    }
    
    /**
     * Build a safe map representation of an Order without lazy-loaded issues
     */
    private Map<String, Object> buildOrderMap(Order order) {
        Map<String, Object> orderMap = new HashMap<>();
        
        try {
            orderMap.put("id", order.getId());
            orderMap.put("orderNumber", order.getOrderNumber());
            orderMap.put("status", order.getStatus() != null ? order.getStatus().toString() : null);
            orderMap.put("totalAmount", order.getTotalAmount());
            orderMap.put("paymentMode", order.getPaymentMode() != null ? order.getPaymentMode().toString() : null);
            orderMap.put("deliveryName", order.getDeliveryName());
            orderMap.put("deliveryEmail", order.getDeliveryEmail());
            orderMap.put("deliveryMobile", order.getDeliveryMobile());
            orderMap.put("deliveryAddress", order.getDeliveryAddress());
            orderMap.put("deliveryPincode", order.getDeliveryPincode());
            orderMap.put("estimatedDeliveryStart", order.getEstimatedDeliveryStart());
            orderMap.put("estimatedDeliveryEnd", order.getEstimatedDeliveryEnd());
            orderMap.put("pickedUpAt", order.getPickedUpAt());
            orderMap.put("outForDeliveryAt", order.getOutForDeliveryAt());
            orderMap.put("deliveredAt", order.getDeliveredAt());
            orderMap.put("createdAt", order.getCreatedAt());
            orderMap.put("trackingId", order.getTrackingId());
            orderMap.put("currentLocation", order.getCurrentLocation());
            
            // Safely get customer info
            try {
                if (order.getCustomer() != null) {
                    Map<String, Object> customerMap = new HashMap<>();
                    customerMap.put("id", order.getCustomer().getId());
                    customerMap.put("name", order.getCustomer().getName());
                    customerMap.put("email", order.getCustomer().getEmail());
                    customerMap.put("mobile", order.getCustomer().getMobile());
                    orderMap.put("customer", customerMap);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error getting customer for order " + order.getId() + ": " + e.getMessage());
            }
            
            // Safely get assignedTo info
            try {
                if (order.getAssignedTo() != null) {
                    Map<String, Object> assignedToMap = new HashMap<>();
                    assignedToMap.put("id", order.getAssignedTo().getId());
                    assignedToMap.put("name", order.getAssignedTo().getName());
                    assignedToMap.put("email", order.getAssignedTo().getEmail());
                    orderMap.put("assignedTo", assignedToMap);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error getting assignedTo for order " + order.getId() + ": " + e.getMessage());
            }
            
            // Safely get items
            try {
                if (order.getItems() != null) {
                    List<Map<String, Object>> itemsList = new java.util.ArrayList<>();
                    for (var item : order.getItems()) {
                        try {
                            Map<String, Object> itemMap = new HashMap<>();
                            itemMap.put("id", item.getId());
                            itemMap.put("quantity", item.getQuantity());
                            itemMap.put("unitPrice", item.getUnitPrice());
                            itemMap.put("totalPrice", item.getTotalPrice());
                            
                            // Safely get product info
                            try {
                                if (item.getProduct() != null) {
                                    Map<String, Object> productMap = new HashMap<>();
                                    productMap.put("id", item.getProduct().getId());
                                    productMap.put("name", item.getProduct().getName());
                                    productMap.put("description", item.getProduct().getDescription());
                                    productMap.put("price", item.getProduct().getPrice());
                                    productMap.put("imageUrl", item.getProduct().getImageUrl());
                                    itemMap.put("product", productMap);
                                }
                            } catch (Exception e) {
                                System.err.println("⚠️ Error getting product for item " + item.getId() + ": " + e.getMessage());
                            }
                            
                            itemsList.add(itemMap);
                        } catch (Exception e) {
                            System.err.println("⚠️ Error building item map: " + e.getMessage());
                        }
                    }
                    orderMap.put("items", itemsList);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error getting items for order " + order.getId() + ": " + e.getMessage());
            }
            
            // Safely get tracking events
            try {
                if (order.getTrackingEvents() != null) {
                    List<Map<String, Object>> eventsList = new java.util.ArrayList<>();
                    for (var event : order.getTrackingEvents()) {
                        try {
                            Map<String, Object> eventMap = new HashMap<>();
                            eventMap.put("id", event.getId());
                            eventMap.put("eventType", event.getEventType() != null ? event.getEventType().toString() : null);
                            eventMap.put("description", event.getDescription());
                            eventMap.put("location", event.getLocation());
                            eventMap.put("eventTime", event.getEventTime());
                            eventMap.put("sequence", event.getSequence());
                            eventsList.add(eventMap);
                        } catch (Exception e) {
                            System.err.println("⚠️ Error building tracking event map: " + e.getMessage());
                        }
                    }
                    orderMap.put("trackingEvents", eventsList);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error getting tracking events for order " + order.getId() + ": " + e.getMessage());
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error building order map: " + e.getMessage());
            throw e;
        }
        
        return orderMap;
    }
}


