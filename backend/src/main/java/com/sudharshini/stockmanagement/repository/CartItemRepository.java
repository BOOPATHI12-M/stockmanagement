package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
}

