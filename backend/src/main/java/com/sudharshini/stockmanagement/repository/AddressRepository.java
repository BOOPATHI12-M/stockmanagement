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
    // JPQL, not native SQL: is_default is a real boolean column on PostgreSQL,
    // so the old "SET is_default = 0" was rejected as an integer/boolean type
    // mismatch. SQLite accepted it because it is dynamically typed.
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.userId = :userId")
    void clearDefaultAddresses(@Param("userId") Long userId);
}
