package com.taoke.course.repository.order;

import com.taoke.course.entity.order.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 订单主表持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
public interface OrderRepository extends JpaRepository<Order, Integer> {

    Optional<Order> findByOrderNo(String orderNo);

    Optional<Order> findByOrderNoAndUserId(String orderNo, Integer userId);

    Page<Order> findByUserId(Integer userId, Pageable pageable);

    Page<Order> findByUserIdAndStatus(Integer userId, Integer status, Pageable pageable);

    /** 查询已过期但仍为待支付的订单（定时任务关闭用） */
    List<Order> findByStatusAndExpiredAtBefore(Integer status, LocalDateTime now);

    long countByCreatedAtAfter(LocalDateTime time);
}
