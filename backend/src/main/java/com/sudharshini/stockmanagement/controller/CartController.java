package com.sudharshini.stockmanagement.controller;

import com.sudharshini.stockmanagement.entity.Cart;
import com.sudharshini.stockmanagement.entity.CartItem;
import com.sudharshini.stockmanagement.entity.Product;
import com.sudharshini.stockmanagement.entity.User;
import com.sudharshini.stockmanagement.repository.CartItemRepository;
import com.sudharshini.stockmanagement.repository.CartRepository;
import com.sudharshini.stockmanagement.repository.ProductRepository;
import com.sudharshini.stockmanagement.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Cart Controller
 * Handles shopping cart operations for authenticated users
 */
@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private CartItemRepository cartItemRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    /**
     * Get or create cart for user (using native SQL for SQLite compatibility)
     */
    private Cart getOrCreateCart(User user) {
        Optional<Cart> cartOpt = cartRepository.findByUser(user);
        if (cartOpt.isPresent()) {
            return cartOpt.get();
        }
        
        // Create cart using native SQL to avoid getGeneratedKeys() issue
        LocalDateTime now = LocalDateTime.now();
        String sql = "INSERT INTO carts (user_id, created_at, updated_at) VALUES (?, ?, ?)";
        Query query = entityManager.createNativeQuery(sql);
        query.setParameter(1, user.getId());
        query.setParameter(2, now);
        query.setParameter(3, now);
        query.executeUpdate();
        
        // Get the ID of the newly inserted cart
        Query idQuery = entityManager.createNativeQuery("SELECT last_insert_rowid()");
        Long newCartId = ((Number) idQuery.getSingleResult()).longValue();
        
        // Fetch the newly created cart
        Optional<Cart> createdCart = cartRepository.findById(newCartId);
        if (createdCart.isPresent()) {
            return createdCart.get();
        }
        
        // Fallback: reload and find by user
        entityManager.flush();
        entityManager.clear();
        return cartRepository.findByUser(user)
            .orElseThrow(() -> new RuntimeException("Failed to create cart"));
    }
    
    /**
     * Get current user's cart
     */
    @GetMapping
    public ResponseEntity<?> getCart() {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            // Only customers can have carts
            if (user.getRole() != User.UserRole.CUSTOMER) {
                return ResponseEntity.status(403).body(Map.of("error", "Cart is only available for customers"));
            }
            
            Cart cart = getOrCreateCart(user);
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get cart: " + e.getMessage()));
        }
    }
    
    /**
     * Add item to cart
     */
    @PostMapping("/items")
    @Transactional
    public ResponseEntity<?> addItem(@RequestBody Map<String, Object> request) {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            // Only customers can add items to cart
            if (user.getRole() != User.UserRole.CUSTOMER) {
                return ResponseEntity.status(403).body(Map.of("error", "Cart is only available for customers"));
            }
            
            Long productId = Long.parseLong(request.get("productId").toString());
            Integer quantity = request.get("quantity") != null ? 
                Integer.parseInt(request.get("quantity").toString()) : 1;
            
            Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
            
            // Get or create cart
            Cart cart = getOrCreateCart(user);
            
            // Check if item already exists in cart
            Optional<CartItem> existingItemOpt = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst();
            
            if (existingItemOpt.isPresent()) {
                // Update quantity using native SQL
                CartItem existingItem = existingItemOpt.get();
                Integer newQuantity = existingItem.getQuantity() + quantity;
                String updateSql = "UPDATE cart_items SET quantity = ? WHERE id = ?";
                Query updateQuery = entityManager.createNativeQuery(updateSql);
                updateQuery.setParameter(1, newQuantity);
                updateQuery.setParameter(2, existingItem.getId());
                updateQuery.executeUpdate();
            } else {
                // Add new item using native SQL
                String insertSql = "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)";
                Query insertQuery = entityManager.createNativeQuery(insertSql);
                insertQuery.setParameter(1, cart.getId());
                insertQuery.setParameter(2, productId);
                insertQuery.setParameter(3, quantity);
                insertQuery.executeUpdate();
            }
            
            // Flush and clear to ensure changes are persisted
            entityManager.flush();
            entityManager.clear();
            
            // Reload cart to get fresh data with updated items
            cart = cartRepository.findById(cart.getId())
                .orElseThrow(() -> new RuntimeException("Cart not found"));
            
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to add item: " + e.getMessage()));
        }
    }
    
    /**
     * Update cart item quantity
     */
    @PutMapping("/items/{itemId}")
    @Transactional
    public ResponseEntity<?> updateItem(@PathVariable Long itemId, @RequestBody Map<String, Object> request) {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            Integer quantity = Integer.parseInt(request.get("quantity").toString());
            
            if (quantity <= 0) {
                return removeItem(itemId);
            }
            
            CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
            
            // Verify item belongs to user's cart
            if (!item.getCart().getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            
            item.setQuantity(quantity);
            cartItemRepository.save(item);
            
            Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
            
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update item: " + e.getMessage()));
        }
    }
    
    /**
     * Remove item from cart
     */
    @DeleteMapping("/items/{itemId}")
    @Transactional
    public ResponseEntity<?> removeItem(@PathVariable Long itemId) {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            // Only customers can remove cart items
            if (user.getRole() != User.UserRole.CUSTOMER) {
                return ResponseEntity.status(403).body(Map.of("error", "Cart is only available for customers"));
            }
            
            CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
            
            // Verify item belongs to user's cart
            if (!item.getCart().getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
            }
            
            cartItemRepository.delete(item);
            
            Cart cart = cartRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
            
            return ResponseEntity.ok(cart);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to remove item: " + e.getMessage()));
        }
    }
    
    /**
     * Clear cart
     */
    @DeleteMapping
    @Transactional
    public ResponseEntity<?> clearCart() {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            // Only customers can clear cart
            if (user.getRole() != User.UserRole.CUSTOMER) {
                return ResponseEntity.status(403).body(Map.of("error", "Cart is only available for customers"));
            }
            
            Optional<Cart> cartOpt = cartRepository.findByUser(user);
            if (cartOpt.isPresent()) {
                Cart cart = cartOpt.get();
                cartItemRepository.deleteAll(cart.getItems());
                cart.getItems().clear();
                cartRepository.save(cart);
            }
            
            return ResponseEntity.ok(Map.of("message", "Cart cleared"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to clear cart: " + e.getMessage()));
        }
    }
    
    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                return null;
            }
            
            String email = authentication.getName();
            return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findByUsername(email).orElse(null));
        } catch (Exception e) {
            return null;
        }
    }
}

