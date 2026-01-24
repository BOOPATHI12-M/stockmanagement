package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    
    @Query("SELECT o FROM Otp o WHERE o.email = :email AND o.verified = false ORDER BY o.createdAt DESC")
    List<Otp> findUnverifiedByEmail(@Param("email") String email);
    
    default Optional<Otp> findLatestUnverifiedByEmail(String email) {
        List<Otp> otps = findUnverifiedByEmail(email);
        return otps.isEmpty() ? Optional.empty() : Optional.of(otps.get(0));
    }
    
    void deleteByEmail(String email);
}

