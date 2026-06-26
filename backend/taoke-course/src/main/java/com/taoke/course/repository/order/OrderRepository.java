package com.taoke.course.repository.order;

import com.taoke.course.entity.order.Order;
import com.taoke.course.enums.ProductType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 订单主表持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
public interface OrderRepository extends JpaRepository<Order, Integer>, JpaSpecificationExecutor<Order> {

    Optional<Order> findByOrderNo(String orderNo);

    Optional<Order> findByOrderNoAndUserId(String orderNo, Integer userId);

    Page<Order> findByUserId(Integer userId, Pageable pageable);

    Page<Order> findByUserIdAndStatus(Integer userId, Integer status, Pageable pageable);

    List<Order> findByUserIdAndStatus(Integer userId, Integer status);

    /** 查询已过期但仍为待支付的订单（定时任务关闭用） */
    List<Order> findByStatusAndExpiredAtBefore(Integer status, LocalDateTime now);

    /**
     * 查询用户对指定商品的有效待支付订单（未超时，按创建时间倒序取最新一条）
     */
    @Query("""
            SELECT DISTINCT o FROM Order o, OrderItem oi
            WHERE oi.orderId = o.id
              AND o.userId = :userId
              AND o.status = 0
              AND (o.expiredAt IS NULL OR o.expiredAt > :now)
              AND oi.productType = :productType
              AND oi.productId = :productId
            ORDER BY o.createdAt DESC
            """)
    List<Order> findActivePendingByUserAndProduct(
            @Param("userId") Integer userId,
            @Param("productType") ProductType productType,
            @Param("productId") Integer productId,
            @Param("now") LocalDateTime now,
            Pageable pageable);

    long countByCreatedAtAfter(LocalDateTime time);
}
