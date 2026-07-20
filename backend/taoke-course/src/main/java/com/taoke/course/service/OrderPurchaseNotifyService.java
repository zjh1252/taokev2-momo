package com.taoke.course.service;

import com.taoke.common.enums.NotificationType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.service.order.OrderServiceImpl;
import com.taoke.user.api.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 订单支付成功后的购买站内信（公开课 / 录播课 / 内训课等统一入口）
 *
 * @author Fangxinxin
 * @date 2026-07-16 16:40
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderPurchaseNotifyService {

    private final OrderServiceImpl orderService;
    private final CourseReserveService courseReserveService;
    private final NotificationService notificationService;

    /**
     * 支付成功后为订单内每个商品发送购买通知（幂等）
     */
    @Transactional
    public void notifyPaidOrder(Integer userId, Integer orderId, List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        for (OrderItem item : items) {
            try {
                notifyItem(userId, orderId, item);
            } catch (Exception e) {
                log.error("购买通知发送失败: userId={}, orderId={}, productType={}, productId={}",
                        userId, orderId, item.getProductType(), item.getProductId(), e);
            }
        }
    }

    /**
     * 前端双保险：按订单号补发全部商品购买通知
     */
    @Transactional
    public void notifyPaidOrderByOrderNo(Integer userId, String orderNo) {
        Order order = orderService.findByOrderNo(orderNo);
        if (!order.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        if (order.getStatus() != OrderStatus.PAID.getValue()) {
            throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID, "订单尚未支付成功");
        }
        List<OrderItem> items = orderService.findItemsByOrderId(order.getId());
        notifyPaidOrder(userId, order.getId(), items);
    }

    private void notifyItem(Integer userId, Integer orderId, OrderItem item) {
        if (item.getProductType() == ProductType.OPEN_COURSE) {
            courseReserveService.reserveAfterPayment(userId, item.getProductId(), orderId);
            return;
        }

        String relatedId = buildPurchaseRelatedId(orderId, item.getProductType(), item.getProductId());
        if (notificationService.exists(userId, NotificationType.ORDER, relatedId)) {
            log.info("购买通知已存在，跳过: userId={}, relatedId={}", userId, relatedId);
            return;
        }

        String typeLabel = item.getProductType() != null ? item.getProductType().getLabel() : "课程";
        String titleName = item.getProductTitle() != null && !item.getProductTitle().isBlank()
                ? item.getProductTitle().trim()
                : "课程";
        String title = String.format("【购买成功】%s%s", titleName, typeLabel);
        String content = String.join("\n",
                "课程购买成功通知",
                "商品名称：" + titleName,
                "商品类型：" + typeLabel,
                "请前往「我的学习 / 我的订单」查看详情。");
        String relatedUrl = resolveRelatedUrl(item);

        notificationService.send(
                userId,
                NotificationType.ORDER,
                title,
                content,
                relatedId,
                relatedUrl);
        log.info("购买通知已发送: userId={}, orderId={}, productType={}, productId={}",
                userId, orderId, item.getProductType(), item.getProductId());
    }

    static String buildPurchaseRelatedId(Integer orderId, ProductType productType, Integer productId) {
        return "purchase:" + orderId + ":" + productType.name() + ":" + productId;
    }

    private String resolveRelatedUrl(OrderItem item) {
        if (item.getProductType() == ProductType.VIDEO_COURSE) {
            return "/video/" + item.getProductId() + ".htm";
        }
        if (item.getProductType() == ProductType.VIDEO_PACKAGE) {
            return "/dashboard/orders";
        }
        if (item.getProductType() == ProductType.INTERNAL_COURSE) {
            return "/course/" + item.getProductId() + ".htm";
        }
        return "/dashboard/orders";
    }
}
