package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.Cart;
import com.sudharshini.stockmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUser(User user);
    Optional<Cart> findByUserId(Long userId);
}

