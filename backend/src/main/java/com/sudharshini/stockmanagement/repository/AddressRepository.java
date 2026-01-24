package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserIdOrderByIsDefaultDescCreatedAtDesc(Long userId);
    
    Optional<Address> findByUserIdAndIsDefaultTrue(Long userId);
    
    @Modifying
    @Transactional
    @Query(value = "UPDATE addresses SET is_default = 0 WHERE user_id = :userId", nativeQuery = true)
    void clearDefaultAddresses(@Param("userId") Long userId);
}
