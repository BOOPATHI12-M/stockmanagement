package com.sudharshini.stockmanagement.controller;

import com.sudharshini.stockmanagement.entity.Product;
import com.sudharshini.stockmanagement.entity.StockMovement;
import com.sudharshini.stockmanagement.entity.User;
import com.sudharshini.stockmanagement.repository.ProductRepository;
import com.sudharshini.stockmanagement.repository.StockMovementRepository;
import com.sudharshini.stockmanagement.repository.UserRepository;
import com.sudharshini.stockmanagement.service.EmailService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Stock Controller
 * Handles stock IN/OUT operations
 */
@RestController
@RequestMapping("/api/stock")
public class StockController {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private StockMovementRepository stockMovementRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserRepository userRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Value("${admin.email}")
    private String adminEmail;
    
    /**
     * Add stock IN
     */
    @PostMapping("/in")
    @Transactional
    public ResponseEntity<?> stockIn(@RequestBody Map<String, Object> request) {
        try {
            Long productId = Long.parseLong(request.get("productId").toString());
            Integer quantity = Integer.parseInt(request.get("quantity").toString());
            String reason = (String) request.getOrDefault("reason", "Purchase");
            String notes = (String) request.getOrDefault("notes", "");
            
            Optional<Product> productOpt = productRepository.findById(productId);
            if (productOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Product not found"));
            }
            
            Product product = productOpt.get();
            product.setStockQuantity(product.getStockQuantity() + quantity);
            productRepository.save(product);
            
            // Use native SQL to avoid getGeneratedKeys() issue with SQLite
            String sql = "INSERT INTO stock_movements (product_id, type, quantity, reason, notes, created_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?)";
            
            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, productId);
            query.setParameter(2, "IN");
            query.setParameter(3, quantity);
            query.setParameter(4, reason != null ? reason : "Purchase");
            query.setParameter(5, notes != null ? notes : "");
            query.setParameter(6, java.sql.Timestamp.valueOf(LocalDateTime.now()));
            
            query.executeUpdate();
            
            return ResponseEntity.ok(Map.of("message", "Stock added successfully", "product", product));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Add stock OUT
     */
    @PostMapping("/out")
    @Transactional
    public ResponseEntity<?> stockOut(@RequestBody Map<String, Object> request) {
        try {
            Long productId = Long.parseLong(request.get("productId").toString());
            Integer quantity = Integer.parseInt(request.get("quantity").toString());
            String reason = (String) request.getOrDefault("reason", "Adjustment");
            String notes = (String) request.getOrDefault("notes", "");
            
            Optional<Product> productOpt = productRepository.findById(productId);
            if (productOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Product not found"));
            }
            
            Product product = productOpt.get();
            if (product.getStockQuantity() < quantity) {
                return ResponseEntity.badRequest().body(Map.of("error", "Insufficient stock"));
            }
            
            product.setStockQuantity(product.getStockQuantity() - quantity);
            productRepository.save(product);
            
            // Use native SQL to avoid getGeneratedKeys() issue with SQLite
            String sql = "INSERT INTO stock_movements (product_id, type, quantity, reason, notes, created_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?)";
            
            Query query = entityManager.createNativeQuery(sql);
            query.setParameter(1, productId);
            query.setParameter(2, "OUT");
            query.setParameter(3, quantity);
            query.setParameter(4, reason != null ? reason : "Adjustment");
            query.setParameter(5, notes != null ? notes : "");
            query.setParameter(6, java.sql.Timestamp.valueOf(LocalDateTime.now()));
            
            query.executeUpdate();
            
            // Check for low stock after OUT
            if (product.isLowStock()) {
                emailService.sendLowStockAlert(product);
            }
            
            return ResponseEntity.ok(Map.of("message", "Stock reduced successfully", "product", product));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }
    
    /**
     * Get stock history for a product
     */
    @GetMapping("/history/{productId}")
    public List<StockMovement> getStockHistory(@PathVariable Long productId) {
        return stockMovementRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }
}

