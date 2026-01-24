package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.LocationTracking;
import com.sudharshini.stockmanagement.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LocationTrackingRepository extends JpaRepository<LocationTracking, Long> {
    
    /**
     * Find all location tracking records for an order, ordered by timestamp descending
     */
    List<LocationTracking> findByOrderOrderByTimestampDesc(Order order);
    
    /**
     * Find the latest location tracking record for an order
     */
    @Query("SELECT lt FROM LocationTracking lt WHERE lt.order = :order ORDER BY lt.timestamp DESC")
    LocationTracking findLatestByOrder(@Param("order") Order order);
    
    /**
     * Find location tracking records for an order within a time range
     */
    @Query("SELECT lt FROM LocationTracking lt WHERE lt.order = :order AND lt.timestamp >= :startTime AND lt.timestamp <= :endTime ORDER BY lt.timestamp ASC")
    List<LocationTracking> findByOrderAndTimestampBetween(
        @Param("order") Order order,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
    
    /**
     * Find location tracking records for an order after acceptance
     */
    @Query("SELECT lt FROM LocationTracking lt WHERE lt.order = :order AND lt.timestamp >= :acceptedAt ORDER BY lt.timestamp ASC")
    List<LocationTracking> findByOrderAfterAcceptance(
        @Param("order") Order order,
        @Param("acceptedAt") LocalDateTime acceptedAt
    );
}
