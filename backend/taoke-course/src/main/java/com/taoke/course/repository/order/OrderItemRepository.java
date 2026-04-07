package com.taoke.course.repository.order;

import com.taoke.course.entity.order.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 订单明细持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {

    List<OrderItem> findByOrderId(Integer orderId);

    List<OrderItem> findByOrderIdIn(List<Integer> orderIds);
}
