package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStockQuantityLessThan(Integer quantity);
    
    // Find products expiring within 15 days using native SQLite query
    // Fallback: if this fails, we'll handle it in the service layer
    @Query(value = "SELECT * FROM products WHERE expiry_date IS NOT NULL AND expiry_date >= date('now') AND expiry_date <= date('now', '+15 days')", nativeQuery = true)
    List<Product> findNearExpiryProducts();
}

