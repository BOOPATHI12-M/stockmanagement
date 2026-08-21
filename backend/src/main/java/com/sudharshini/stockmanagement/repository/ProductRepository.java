package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStockQuantityLessThan(Integer quantity);
    
    // Derived query so Hibernate emits SQL for whichever dialect is active.
    // The previous native query used SQLite's date('now', '+15 days'), which
    // does not exist in PostgreSQL. BETWEEN is inclusive at both ends and
    // skips NULL expiry dates, matching the old behaviour.
    List<Product> findByExpiryDateBetween(LocalDate start, LocalDate end);

    /** Products expiring within the next 15 days (inclusive of today). */
    default List<Product> findNearExpiryProducts() {
        LocalDate today = LocalDate.now();
        return findByExpiryDateBetween(today, today.plusDays(15));
    }
}

