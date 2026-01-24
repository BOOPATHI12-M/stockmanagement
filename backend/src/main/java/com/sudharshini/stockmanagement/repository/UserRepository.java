package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByUsername(String username);
    Optional<User> findByMobile(String mobile);
}

