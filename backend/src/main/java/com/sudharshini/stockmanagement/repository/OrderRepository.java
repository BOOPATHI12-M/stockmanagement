package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.Order;
import com.sudharshini.stockmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerOrderByCreatedAtDesc(User customer);
    Optional<Order> findByOrderNumber(String orderNumber);
    Optional<Order> findByTrackingId(String trackingId);
    
    // Delivery management queries
    List<Order> findByAssignedTo(User deliveryMan);
    List<Order> findByAssignedToIsNullAndStatusIn(List<Order.OrderStatus> statuses);
    List<Order> findByStatus(Order.OrderStatus status);
    List<Order> findByAssignedToAndStatus(User deliveryMan, Order.OrderStatus status);
    
    // Custom query to handle missing products gracefully using LEFT JOIN
    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product " +
           "LEFT JOIN FETCH o.customer " +
           "LEFT JOIN FETCH o.assignedTo " +
           "ORDER BY o.createdAt DESC")
    List<Order> findAllWithProducts();
}

