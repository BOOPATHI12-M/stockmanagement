package com.sudharshini.stockmanagement.controller;

import com.sudharshini.stockmanagement.dto.OrderRequest;
import com.sudharshini.stockmanagement.entity.LocationTracking;
import com.sudharshini.stockmanagement.entity.Order;
import com.sudharshini.stockmanagement.entity.OrderItem;
import com.sudharshini.stockmanagement.entity.User;
import com.sudharshini.stockmanagement.repository.LocationTrackingRepository;
import com.sudharshini.stockmanagement.repository.OrderRepository;
import com.sudharshini.stockmanagement.repository.UserRepository;
import com.sudharshini.stockmanagement.service.GoogleMapsService;
import com.sudharshini.stockmanagement.service.GoogleSheetsService;
import com.sudharshini.stockmanagement.service.OrderService;
import com.sudharshini.stockmanagement.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Order Controller
 * Handles order operations
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private LocationTrackingRepository locationTrackingRepository;
    
    @Autowired
    private GoogleMapsService googleMapsService;
    
    @Autowired
    private GoogleSheetsService googleSheetsService;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Create a new order
     */
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest request) {
        try {
            System.out.println("🔍 Creating order with request: " + request);
            
            // Get authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                System.out.println("❌ Authentication failed");
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            
            String email = authentication.getName();
            System.out.println("🔍 Finding user with email: " + email);
            
            User customer = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        System.out.println("❌ User not found: " + email);
                        return new RuntimeException("User not found");
                    });
            
            System.out.println("✅ Found customer: " + customer.getEmail() + " (ID: " + customer.getId() + ")");
            System.out.println("📦 Order items: " + (request.getItems() != null ? request.getItems().size() : 0));
            
            Order order = orderService.createOrder(customer.getId(), request);
            System.out.println("✅ Order created successfully: " + order.getId());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            System.out.println("❌ Error creating order: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to create order",
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Get order by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        return ResponseEntity.ok(order);
    }
    
    /**
     * Get orders by customer (current logged-in user)
     */
    @GetMapping("/customer/me")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyOrders() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
            }
            
            String email = authentication.getName();
            User customer = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Order> orders = orderService.getOrdersByCustomer(customer.getId());
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("❌ Error getting customer orders: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to load orders",
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Get orders by customer ID (admin only)
     */
    @GetMapping("/customer/{customerId}")
    public List<Order> getCustomerOrders(@PathVariable Long customerId) {
        return orderService.getOrdersByCustomer(customerId);
    }
    
    /**
     * Get order by order number (public endpoint for tracking)
     */
    @GetMapping("/by-order-number/{orderNumber}")
    public ResponseEntity<?> getOrderByOrderNumber(@PathVariable String orderNumber) {
        try {
            Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Order not found with order number: " + orderNumber));
            }
            Order order = orderOpt.get();
            return ResponseEntity.ok(Map.of(
                "id", order.getId(),
                "orderNumber", order.getOrderNumber(),
                "trackingId", order.getTrackingId() != null ? order.getTrackingId() : "",
                "status", order.getStatus().name()
            ));
        } catch (Exception e) {
            System.err.println("Error finding order by order number: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to find order: " + e.getMessage()));
        }
    }
    
    /**
     * Get order by tracking ID (public endpoint for tracking)
     */
    @GetMapping("/by-tracking-id/{trackingId}")
    public ResponseEntity<?> getOrderByTrackingId(@PathVariable String trackingId) {
        try {
            Optional<Order> orderOpt = orderRepository.findByTrackingId(trackingId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Order not found with tracking ID: " + trackingId));
            }
            Order order = orderOpt.get();
            return ResponseEntity.ok(Map.of(
                "id", order.getId(),
                "orderNumber", order.getOrderNumber(),
                "trackingId", order.getTrackingId() != null ? order.getTrackingId() : "",
                "status", order.getStatus().name()
            ));
        } catch (Exception e) {
            System.err.println("Error finding order by tracking ID: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to find order: " + e.getMessage()));
        }
    }
    
    /**
     * Test Google Sheets connection (admin only)
     */
    @PostMapping("/test-sheets")
    public ResponseEntity<?> testGoogleSheets() {
        try {
            // Create a test order object
            Order testOrder = new Order();
            testOrder.setId(999L);
            testOrder.setDeliveryName("Test User");
            testOrder.setDeliveryMobile("1234567890");
            testOrder.setDeliveryAddress("Test Address, Test City");
            testOrder.setStatus(Order.OrderStatus.CONFIRMED);
            
            // Create a test order item
            OrderItem testItem = new OrderItem();
            testItem.setQuantity(5);
            testOrder.setItems(java.util.Collections.singletonList(testItem));
            
            boolean success = googleSheetsService.appendOrder(testOrder);
            
            if (success) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Test order successfully appended to Google Sheets! Check your spreadsheet."
                ));
            } else {
                return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Failed to append test order. Check backend logs for details."
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Get all orders (admin)
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllOrders() {
        System.out.println("🔵 [GET ALL ORDERS] Starting to fetch all orders...");
        try {
            List<Order> orders = orderService.getAllOrders();
            System.out.println("✅ [GET ALL ORDERS] Successfully fetched " + (orders != null ? orders.size() : 0) + " orders");
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ [GET ALL ORDERS] Error in getAllOrders: " + e.getMessage());
            System.err.println("❌ [GET ALL ORDERS] Exception type: " + e.getClass().getName());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to load orders: " + e.getMessage(),
                "exceptionType", e.getClass().getSimpleName()
            ));
        }
    }
    
    /**
     * Update order status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            if (statusStr == null || statusStr.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Status is required"));
            }
            
            Order.OrderStatus newStatus = Order.OrderStatus.valueOf(statusStr);
            String cancellationReason = request.get("cancellationReason");
            
            // If canceling, require a reason
            if (newStatus == Order.OrderStatus.CANCELLED) {
                if (cancellationReason == null || cancellationReason.trim().isEmpty()) {
                    return ResponseEntity.status(400).body(Map.of(
                        "error", "Cancellation reason is required when canceling an order"
                    ));
                }
            }
            
            Order order = orderService.updateOrderStatus(id, newStatus, cancellationReason);
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid status: " + request.get("status")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update order status: " + e.getMessage()));
        }
    }
    
    /**
     * Get tracking information for an order
     * Public endpoint - accessible without authentication
     */
    @GetMapping("/{id}/tracking")
    public ResponseEntity<?> getTracking(@PathVariable Long id) {
        try {
        Order order = orderService.getOrderById(id);
        
            if (order == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Order not found"));
            }
            
            // Initialize lazy-loaded collections
            try {
                if (order.getTrackingEvents() != null) {
                    order.getTrackingEvents().size(); // Force initialization
                }
            } catch (Exception e) {
                System.err.println("Warning: Error initializing tracking events: " + e.getMessage());
            }
            
            Map<String, Object> tracking = new HashMap<>();
            tracking.put("orderId", order.getId());
            tracking.put("orderNumber", order.getOrderNumber());
            tracking.put("trackingId", order.getTrackingId() != null ? order.getTrackingId() : "");
            tracking.put("courierName", order.getCourierName() != null ? order.getCourierName() : "");
            tracking.put("status", order.getStatus() != null ? order.getStatus().name() : "UNKNOWN");
            tracking.put("estimatedDeliveryStart", order.getEstimatedDeliveryStart());
            tracking.put("estimatedDeliveryEnd", order.getEstimatedDeliveryEnd());
            tracking.put("events", order.getTrackingEvents() != null ? order.getTrackingEvents() : List.of());
            
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            System.err.println("Error getting tracking information: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get tracking information: " + e.getMessage()));
        }
    }
    
    /**
     * Get real-time location tracking for an order (for customers)
     */
    @GetMapping("/{id}/location-tracking")
    public ResponseEntity<?> getLocationTracking(@PathVariable Long id) {
        try {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            // Optional: Verify user is the customer or admin if authenticated
            // But allow public access (like tracking endpoint) for better UX
            try {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser")) {
                    String email = authentication.getName();
                    User user = userRepository.findByEmail(email).orElse(null);
                    
                    // If user is authenticated, verify they are the customer or admin
                    if (user != null && user.getRole() != User.UserRole.ADMIN && 
                        (order.getCustomer() == null || !order.getCustomer().getId().equals(user.getId()))) {
                        return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
                    }
                }
            } catch (Exception e) {
                // If authentication check fails, allow public access (for tracking page)
                System.out.println("Authentication check failed, allowing public access: " + e.getMessage());
            }
            
            // Check if order is accepted and has a delivery man assigned
            if (order.getAssignedTo() == null || order.getAcceptedAt() == null) {
                return ResponseEntity.ok(Map.of(
            "orderId", order.getId(),
            "orderNumber", order.getOrderNumber(),
                    "status", order.getStatus().name(),
                    "trackingEnabled", false,
                    "message", "Order not yet accepted by delivery man"
                ));
            }
            
            // Get location history
            List<LocationTracking> locationHistory = locationTrackingRepository
                    .findByOrderAfterAcceptance(order, order.getAcceptedAt());
            
            // Parse current location from order
            Map<String, Object> currentLocation = null;
            if (order.getCurrentLocation() != null && !order.getCurrentLocation().isEmpty()) {
                try {
                    currentLocation = objectMapper.readValue(order.getCurrentLocation(), Map.class);
                } catch (Exception e) {
                    System.err.println("Error parsing current location: " + e.getMessage());
                }
            }
            
            // Parse pickup and delivery locations
            Map<String, Object> pickupLocation = null;
            Map<String, Object> deliveryLocation = null;
            
            if (order.getPickupLocation() != null && !order.getPickupLocation().isEmpty()) {
                try {
                    pickupLocation = objectMapper.readValue(order.getPickupLocation(), Map.class);
                } catch (Exception e) {
                    System.err.println("Error parsing pickup location: " + e.getMessage());
                }
            }
            
            if (order.getDeliveryLocation() != null && !order.getDeliveryLocation().isEmpty()) {
                try {
                    deliveryLocation = objectMapper.readValue(order.getDeliveryLocation(), Map.class);
                } catch (Exception e) {
                    System.err.println("Error parsing delivery location: " + e.getMessage());
                }
            }
            
            // If delivery location is missing but pincode exists, geocode it
            if (deliveryLocation == null && order.getDeliveryPincode() != null && !order.getDeliveryPincode().isEmpty()) {
                try {
                    System.out.println("📍 Geocoding pincode for order: " + order.getDeliveryPincode());
                    Map<String, Object> geocodeResult = googleMapsService.geocodePincode(order.getDeliveryPincode(), "IN");
                    if (geocodeResult.get("success") != null && (Boolean) geocodeResult.get("success")) {
                        deliveryLocation = new HashMap<>();
                        deliveryLocation.put("lat", geocodeResult.get("lat"));
                        deliveryLocation.put("lng", geocodeResult.get("lng"));
                        deliveryLocation.put("address", geocodeResult.get("address"));
                        deliveryLocation.put("pincode", order.getDeliveryPincode());
                        
                        // Save to database for future use
                        String deliveryLocationJson = objectMapper.writeValueAsString(deliveryLocation);
                        String updateSql = "UPDATE orders SET delivery_location = ? WHERE id = ?";
                        jakarta.persistence.Query updateQuery = entityManager.createNativeQuery(updateSql);
                        updateQuery.setParameter(1, deliveryLocationJson);
                        updateQuery.setParameter(2, order.getId());
                        updateQuery.executeUpdate();
                        
                        System.out.println("✅ Geocoded and saved delivery location for pincode: " + order.getDeliveryPincode());
                    }
                } catch (Exception e) {
                    System.err.println("Error geocoding pincode in location tracking: " + e.getMessage());
                }
            }
            
            // Set default pickup location if missing
            if (pickupLocation == null) {
                pickupLocation = new HashMap<>();
                pickupLocation.put("lat", 12.9716); // Bangalore default
                pickupLocation.put("lng", 77.5946);
                pickupLocation.put("address", "Sudharshini Warehouse, Bangalore");
            }
            
            // Calculate route if we have current location and delivery location
            Map<String, Object> route = null;
            if (currentLocation != null && deliveryLocation != null) {
                try {
                    Double currentLat = ((Number) currentLocation.get("lat")).doubleValue();
                    Double currentLng = ((Number) currentLocation.get("lng")).doubleValue();
                    Double destLat = ((Number) deliveryLocation.get("lat")).doubleValue();
                    Double destLng = ((Number) deliveryLocation.get("lng")).doubleValue();
                    
                    route = googleMapsService.getRoute(currentLat, currentLng, destLat, destLng);
                } catch (Exception e) {
                    System.err.println("Error calculating route: " + e.getMessage());
                }
            }
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.getId());
            response.put("orderNumber", order.getOrderNumber());
            response.put("status", order.getStatus().name());
            response.put("trackingEnabled", true);
            response.put("currentLocation", currentLocation);
            response.put("pickupLocation", pickupLocation);
            response.put("deliveryLocation", deliveryLocation);
            response.put("locationHistory", locationHistory.stream().map(lt -> {
                Map<String, Object> loc = new HashMap<>();
                loc.put("lat", lt.getLatitude());
                loc.put("lng", lt.getLongitude());
                loc.put("address", lt.getAddress());
                loc.put("timestamp", lt.getTimestamp().toString());
                loc.put("accuracy", lt.getAccuracy());
                loc.put("speed", lt.getSpeed());
                loc.put("heading", lt.getHeading());
                return loc;
            }).collect(java.util.stream.Collectors.toList()));
            response.put("route", route);
            response.put("googleMapsApiKey", googleMapsService.getApiKey());
        
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get location tracking: " + e.getMessage()));
        }
    }
}

