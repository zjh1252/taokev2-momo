package com.taoke.course.service.order;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.VideoOrderAdminService;
import com.taoke.course.dto.order.AdminVideoOrderListItemVO;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.entity.pay.Payment;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.PaymentStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.mapper.OrderMapper;
import com.taoke.course.repository.order.OrderItemRepository;
import com.taoke.course.repository.order.OrderRepository;
import com.taoke.course.repository.pay.PaymentRepository;
import com.taoke.course.repository.video.VideoEnrollmentRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.service.pay.PayServiceImpl;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 录播课订单管理实现
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Service
@RequiredArgsConstructor
public class VideoOrderAdminServiceImpl implements VideoOrderAdminService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderMapper orderMapper;
    private final VideoEnrollmentRepository videoEnrollmentRepository;
    private final VideoRepository videoRepository;
    private final PaymentRepository paymentRepository;
    private final PayServiceImpl payService;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminVideoOrderListItemVO> listVideoOrders(String keyword, Integer status,
                                                                    String publisherKeyword,
                                                                    LocalDate startDate, LocalDate endDate,
                                                                    int page, int size) {
        int safePage = Math.max(1, page);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);

        Specification<Order> spec = buildSpec(keyword, status, publisherKeyword, startDate, endDate);
        Page<Order> orderPage = orderRepository.findAll(
                spec,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "id")));

        if (orderPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, safePage, safeSize);
        }

        List<Order> orders = orderPage.getContent();
        List<Integer> orderIds = orders.stream().map(Order::getId).toList();
        Map<Integer, List<OrderItem>> itemsByOrder = orderItemRepository.findByOrderIdIn(orderIds).stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));

        List<Integer> userIds = orders.stream().map(Order::getUserId).distinct().toList();
        Map<Integer, String> userNameMap = userService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, this::resolveUserName));

        List<AdminVideoOrderListItemVO> items = orders.stream().map(order -> {
            AdminVideoOrderListItemVO vo = toAdminVO(order, itemsByOrder.getOrDefault(order.getId(), List.of()));
            vo.setUserId(order.getUserId());
            vo.setUserName(userNameMap.getOrDefault(order.getUserId(), "UID:" + order.getUserId()));
            vo.setLearnerCount(videoEnrollmentRepository.countByOrderIdAndStatus(order.getId(), 1));
            return vo;
        }).toList();

        return PageResponse.of(items, orderPage.getTotalElements(), safePage, safeSize);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminVideoOrderListItemVO getDetailById(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        boolean hasVideoItem = items.stream()
                .anyMatch(i -> i.getProductType() == ProductType.VIDEO_COURSE
                        || i.getProductType() == ProductType.VIDEO_PACKAGE);
        if (!hasVideoItem) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        AdminVideoOrderListItemVO vo = toAdminVO(order, items);
        vo.setUserId(order.getUserId());
        userService.findAllByIds(List.of(order.getUserId())).stream().findFirst()
                .ifPresent(u -> vo.setUserName(resolveUserName(u)));
        vo.setLearnerCount(videoEnrollmentRepository.countByOrderIdAndStatus(order.getId(), 1));
        return vo;
    }

    @Override
    @Transactional
    public AdminVideoOrderListItemVO refreshOrderStatus(String orderNo) {
        Order order = orderRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() == OrderStatus.PENDING.getValue()) {
            if (order.getExpiredAt() != null && order.getExpiredAt().isBefore(LocalDateTime.now())) {
                order.setStatus(OrderStatus.EXPIRED.getValue());
                orderRepository.save(order);
            } else {
                Optional<Payment> paymentOpt = paymentRepository.findByOrderId(order.getId());
                if (paymentOpt.isPresent()) {
                    Payment payment = paymentOpt.get();
                    if (payment.getStatus() == PaymentStatus.SUCCESS.getValue()) {
                        payService.onPaymentSuccess(order, payment);
                        order = orderRepository.findById(order.getId()).orElse(order);
                    }
                }
            }
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        AdminVideoOrderListItemVO vo = toAdminVO(order, items);
        vo.setUserId(order.getUserId());
        userService.findAllByIds(List.of(order.getUserId())).stream().findFirst()
                .ifPresent(u -> vo.setUserName(resolveUserName(u)));
        vo.setLearnerCount(videoEnrollmentRepository.countByOrderIdAndStatus(order.getId(), 1));
        return vo;
    }

    @Override
    @Transactional
    public void batchDelete(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        List<Order> orders = orderRepository.findAllById(ids);
        for (Order order : orders) {
            int st = order.getStatus();
            if (st == OrderStatus.PAID.getValue() || st == OrderStatus.REFUNDED.getValue()) {
                throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID,
                        "订单 " + order.getOrderNo() + " 已支付或已退款，不可删除");
            }
        }
        List<Integer> orderIds = orders.stream().map(Order::getId).toList();
        for (Integer orderId : orderIds) {
            paymentRepository.findByOrderId(orderId).ifPresent(paymentRepository::delete);
        }
        orderItemRepository.findByOrderIdIn(orderIds).forEach(orderItemRepository::delete);
        orderRepository.deleteAll(orders);
    }

    private Specification<Order> buildSpec(String keyword, Integer status, String publisherKeyword,
                                            LocalDate startDate, LocalDate endDate) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            Subquery<Integer> videoOrderSub = cq.subquery(Integer.class);
            Root<OrderItem> oiRoot = videoOrderSub.from(OrderItem.class);
            videoOrderSub.select(oiRoot.get("orderId"));
            videoOrderSub.where(oiRoot.get("productType").in(ProductType.VIDEO_COURSE, ProductType.VIDEO_PACKAGE));
            predicates.add(root.get("id").in(videoOrderSub));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), endDate.plusDays(1).atStartOfDay()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                List<Integer> matchedUserIds = userService.searchUsers(keyword.trim(), null,
                                PageRequest.of(0, 50))
                        .getContent().stream().map(User::getId).toList();
                List<Predicate> keywordPreds = new ArrayList<>();
                keywordPreds.add(cb.like(root.get("orderNo"), like));
                if (!matchedUserIds.isEmpty()) {
                    keywordPreds.add(root.get("userId").in(matchedUserIds));
                }
                predicates.add(cb.or(keywordPreds.toArray(Predicate[]::new)));
            }
            if (publisherKeyword != null && !publisherKeyword.isBlank()) {
                List<Integer> publisherUserIds = resolvePublisherUserIds(publisherKeyword.trim());
                if (publisherUserIds.isEmpty()) {
                    predicates.add(cb.disjunction());
                } else {
                    List<Integer> videoIds = videoRepository.findByPublisherIdIn(publisherUserIds).stream()
                            .map(v -> v.getId()).toList();
                    if (videoIds.isEmpty()) {
                        predicates.add(cb.disjunction());
                    } else {
                        Subquery<Integer> pubOrderSub = cq.subquery(Integer.class);
                        Root<OrderItem> pubOi = pubOrderSub.from(OrderItem.class);
                        pubOrderSub.select(pubOi.get("orderId"));
                        pubOrderSub.where(cb.and(
                                pubOi.get("productType").in(ProductType.VIDEO_COURSE, ProductType.VIDEO_PACKAGE),
                                cb.or(
                                        cb.and(pubOi.get("productType").in(ProductType.VIDEO_COURSE),
                                                pubOi.get("productId").in(videoIds))
                                )
                        ));
                        predicates.add(root.get("id").in(pubOrderSub));
                    }
                }
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private List<Integer> resolvePublisherUserIds(String keyword) {
        Set<Integer> ids = new LinkedHashSet<>();
        userService.searchUsers(keyword, null, PageRequest.of(0, 50)).getContent()
                .forEach(u -> ids.add(u.getId()));
        return new ArrayList<>(ids);
    }

    private AdminVideoOrderListItemVO toAdminVO(Order order, List<OrderItem> items) {
        AdminVideoOrderListItemVO vo = new AdminVideoOrderListItemVO();
        var base = orderMapper.toVO(order, items);
        vo.setId(base.getId());
        vo.setOrderNo(base.getOrderNo());
        vo.setTotalAmount(base.getTotalAmount());
        vo.setPayAmount(base.getPayAmount());
        vo.setStatus(base.getStatus());
        vo.setStatusLabel(base.getStatusLabel());
        vo.setRemark(base.getRemark());
        vo.setPaidAt(base.getPaidAt());
        vo.setExpiredAt(base.getExpiredAt());
        vo.setCreatedAt(base.getCreatedAt());
        vo.setItems(base.getItems());
        vo.setVideoTitles(items.stream()
                .filter(i -> i.getProductType() == ProductType.VIDEO_COURSE
                        || i.getProductType() == ProductType.VIDEO_PACKAGE)
                .map(OrderItem::getProductTitle)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .collect(Collectors.joining("、")));
        return vo;
    }

    private String resolveUserName(User user) {
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname().trim();
        }
        if (user.getRealName() != null && !user.getRealName().isBlank()) {
            return user.getRealName().trim();
        }
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            return user.getPhone().trim();
        }
        return "UID:" + user.getId();
    }
}
