package com.sudharshini.stockmanagement.repository;

import com.sudharshini.stockmanagement.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct_IdOrderByCreatedAtDesc(Long productId);
    
    List<Review> findByUser_IdOrderByCreatedAtDesc(Long userId);
    
    Optional<Review> findByProduct_IdAndUser_Id(Long productId, Long userId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Long getReviewCountByProductId(@Param("productId") Long productId);
}
