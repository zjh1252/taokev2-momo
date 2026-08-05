package com.taoke.course.mapper;

import com.taoke.course.dto.order.OrderItemVO;
import com.taoke.course.dto.order.OrderVO;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.enums.OrderDisplayStatus;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.ProductType;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单对象映射器
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Component
public class OrderMapper {

    public OrderVO toVO(Order order) {
        return toVO(order, LocalDateTime.now());
    }

    public OrderVO toVO(Order order, LocalDateTime now) {
        if (order == null) {
            return null;
        }
        OrderDisplayStatus displayStatus = OrderDisplayStatus.resolve(order, now);
        OrderVO vo = new OrderVO();
        vo.setId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        vo.setTotalAmount(order.getTotalAmount());
        vo.setPayAmount(order.getPayAmount());
        vo.setStatus(order.getStatus());
        vo.setStatusLabel(OrderStatus.of(order.getStatus()).getLabel());
        vo.setDisplayStatus(displayStatus.name());
        vo.setDisplayStatusLabel(displayStatus.getLabel());
        vo.setViewed(order.getBuyerViewedAt() != null && displayStatus.name().equals(order.getBuyerViewedStatus()));
        vo.setRemark(order.getRemark());
        vo.setPaidAt(order.getPaidAt());
        vo.setExpiredAt(order.getExpiredAt());
        vo.setValidUntil(order.getValidUntil());
        vo.setCreatedAt(order.getCreatedAt());
        return vo;
    }

    public OrderVO toVO(Order order, List<OrderItem> items) {
        return toVO(order, items, LocalDateTime.now());
    }

    public OrderVO toVO(Order order, List<OrderItem> items, LocalDateTime now) {
        OrderVO vo = toVO(order, now);
        if (vo != null && items != null) {
            vo.setItems(items.stream().map(this::toItemVO).toList());
        }
        return vo;
    }

    public OrderItemVO toItemVO(OrderItem item) {
        if (item == null) {
            return null;
        }
        OrderItemVO vo = new OrderItemVO();
        vo.setId(item.getId());
        vo.setProductType(item.getProductType().name());
        vo.setProductTypeLabel(item.getProductType().getLabel());
        vo.setProductId(item.getProductId());
        vo.setProductTitle(item.getProductTitle());
        vo.setProductCover(item.getProductCover());
        vo.setPrice(item.getPrice());
        vo.setQuantity(item.getQuantity());
        vo.setSubtotal(item.getSubtotal());
        return vo;
    }

    public List<OrderVO> toVOList(List<Order> orders) {
        if (orders == null) {
            return null;
        }
        return orders.stream().map(this::toVO).toList();
    }
}
