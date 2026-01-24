package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.TrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrackingEventRepository extends JpaRepository<TrackingEvent, Long> {
    List<TrackingEvent> findByOrderIdOrderBySequenceAsc(Long orderId);
}

