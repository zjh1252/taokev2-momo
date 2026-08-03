package com.taoke.course.service.order;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.order.CreateOrderRequest;
import com.taoke.course.dto.order.OrderItemVO;
import com.taoke.course.dto.order.OrderUnviewedCountVO;
import com.taoke.course.dto.order.OrderVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.cart.Cart;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoPackageGroup;
import com.taoke.course.enums.OrderDisplayStatus;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.mapper.OrderMapper;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.order.OrderItemRepository;
import com.taoke.course.repository.order.OrderRepository;
import com.taoke.course.repository.video.VideoPackageGroupRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.service.cart.CartServiceImpl;
import com.taoke.course.service.video.VideoPurchasePricing;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * 订单业务实现
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Service
@RequiredArgsConstructor
public class OrderServiceImpl {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CourseRepository courseRepository;
    private final VideoRepository videoRepository;
    private final VideoPackageGroupRepository packageGroupRepository;
    private final CartServiceImpl cartService;
    private final OrderMapper orderMapper;

    private static final DateTimeFormatter ORDER_NO_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final Random RANDOM = new Random();

    /**
     * 创建订单
     * <p>
     * 支持从购物车结算和直接购买两种模式，至少需要一种有效商品输入。
     * </p>
     */
    @Transactional
    public OrderVO createOrder(Integer userId, CreateOrderRequest request) {
        List<OrderItem> items = new ArrayList<>();

        if (request.getCartItemIds() != null && !request.getCartItemIds().isEmpty()) {
            // 从购物车结算
            List<Cart> carts = cartService.findByIdsAndUserId(request.getCartItemIds(), userId);
            if (carts.isEmpty()) {
                throw new BusinessException(ErrorCode.ORDER_ITEMS_EMPTY);
            }
            for (Cart cart : carts) {
                OrderItem item = buildOrderItem(cart.getProductType(), cart.getProductId(), cart.getQuantity(), userId);
                items.add(item);
            }
            // 下单后从购物车移除
            cartService.removeItems(request.getCartItemIds());

        } else if (request.getDirectItem() != null) {
            // 直接购买
            CreateOrderRequest.DirectItem di = request.getDirectItem();
            ProductType pt = ProductType.valueOf(di.getProductType());
            OrderItem item = buildOrderItem(pt, di.getProductId(),
                    di.getQuantity() != null ? di.getQuantity() : 1, userId);
            items.add(item);
        } else {
            throw new BusinessException(ErrorCode.ORDER_ITEMS_EMPTY);
        }

        BigDecimal totalAmount = items.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setTotalAmount(totalAmount);
        order.setPayAmount(totalAmount);
        order.setStatus(OrderStatus.PENDING.getValue());
        order.setRemark(request.getRemark() != null ? request.getRemark() : "");
        // 未支付订单 10 分钟内有效，超时由定时任务自动关闭
        order.setExpiredAt(LocalDateTime.now().plusMinutes(10));

        orderRepository.save(order);

        for (OrderItem item : items) {
            item.setOrderId(order.getId());
        }
        orderItemRepository.saveAll(items);

        return orderMapper.toVO(order, items);
    }

    /**
     * 我的订单列表（分页）
     */
    public PageResponse<OrderVO> listOrders(Integer userId, Integer status, String displayStatus, int page, int size) {
        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        LocalDateTime now = LocalDateTime.now();

        Page<Order> orderPage;
        if (displayStatus != null && !displayStatus.isBlank()) {
            OrderDisplayStatus parsedStatus = OrderDisplayStatus.of(displayStatus);
            orderPage = orderRepository.findAll(buildDisplayStatusSpec(userId, parsedStatus, now), pageable);
        } else if (status != null) {
            orderPage = orderRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            orderPage = orderRepository.findByUserId(userId, pageable);
        }

        List<Order> orders = orderPage.getContent();
        if (orders.isEmpty()) {
            return PageResponse.of(List.of(), orderPage.getTotalElements(), page, size);
        }

        // 批量查订单明细
        List<Integer> orderIds = orders.stream().map(Order::getId).toList();
        List<OrderItem> allItems = orderItemRepository.findByOrderIdIn(orderIds);
        Map<Integer, List<OrderItem>> itemMap = allItems.stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));

        List<OrderVO> voList = orders.stream().map(o -> {
            List<OrderItem> orderItems = itemMap.getOrDefault(o.getId(), List.of());
            return orderMapper.toVO(o, orderItems, now);
        }).toList();

        enrichVideoEpisodes(voList);

        return PageResponse.of(voList, orderPage.getTotalElements(), page, size);
    }

    public OrderUnviewedCountVO getUnviewedCounts(Integer userId) {
        LocalDateTime now = LocalDateTime.now();
        OrderUnviewedCountVO vo = new OrderUnviewedCountVO();
        vo.setPending(countUnviewed(userId, OrderDisplayStatus.PENDING, now));
        vo.setPaymentExpired(countUnviewed(userId, OrderDisplayStatus.PAYMENT_EXPIRED, now));
        vo.setCourseExpired(countUnviewed(userId, OrderDisplayStatus.COURSE_EXPIRED, now));
        vo.setPaid(countUnviewed(userId, OrderDisplayStatus.PAID, now));
        vo.setCancelled(countUnviewed(userId, OrderDisplayStatus.CANCELLED, now));
        return vo;
    }

    @Transactional
    public void markDisplayStatusViewed(Integer userId, String displayStatus) {
        OrderDisplayStatus parsedStatus = OrderDisplayStatus.of(displayStatus);
        LocalDateTime now = LocalDateTime.now();
        List<Order> orders = orderRepository.findAll(
                buildDisplayStatusSpec(userId, parsedStatus, now)
                        .and(unviewedSpec(parsedStatus)));
        orders.forEach(order -> {
            order.setBuyerViewedAt(now);
            order.setBuyerViewedStatus(parsedStatus.name());
        });
        if (!orders.isEmpty()) {
            orderRepository.saveAll(orders);
        }
    }

    /**
     * 订单详情
     */
    public OrderVO getOrderDetail(Integer userId, String orderNo) {
        Order order = orderRepository.findByOrderNoAndUserId(orderNo, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        OrderVO vo = orderMapper.toVO(order, items);
        enrichVideoEpisodes(List.of(vo));
        return vo;
    }

    /**
     * 查询用户对指定商品的有效待支付订单（购买前提醒用，无则返回 null）
     */
    public OrderVO findPendingOrderByProduct(Integer userId, String productTypeStr, Integer productId) {
        ProductType productType = ProductType.valueOf(productTypeStr);
        List<Order> orders = orderRepository.findActivePendingByUserAndProduct(
                userId,
                productType,
                productId,
                LocalDateTime.now(),
                PageRequest.of(0, 1));
        if (orders.isEmpty()) {
            return null;
        }
        Order order = orders.get(0);
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        OrderVO vo = orderMapper.toVO(order, items);
        enrichVideoEpisodes(List.of(vo));
        return vo;
    }

    /**
     * 批量回填订单明细中录播课的总集数（帮助用户区分单门课与系列课）
     */
    private void enrichVideoEpisodes(List<OrderVO> voList) {
        List<OrderItemVO> videoItems = voList.stream()
                .filter(vo -> vo.getItems() != null)
                .flatMap(vo -> vo.getItems().stream())
                .filter(item -> ProductType.VIDEO_COURSE.name().equals(item.getProductType()))
                .toList();
        if (videoItems.isEmpty()) {
            return;
        }

        List<Integer> videoIds = videoItems.stream()
                .map(OrderItemVO::getProductId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        if (videoIds.isEmpty()) {
            return;
        }

        Map<Integer, Integer> episodesMap = videoRepository.findAllById(videoIds).stream()
                .collect(Collectors.toMap(Video::getId,
                        v -> v.getTotalEpisodes() != null ? v.getTotalEpisodes() : 0));

        videoItems.forEach(item ->
                item.setTotalEpisodes(episodesMap.getOrDefault(item.getProductId(), 0)));
    }

    /**
     * 取消订单
     */
    @Transactional
    public void cancelOrder(Integer userId, String orderNo) {
        Order order = orderRepository.findByOrderNoAndUserId(orderNo, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getStatus() != OrderStatus.PENDING.getValue()) {
            throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID);
        }
        order.setStatus(OrderStatus.CANCELLED.getValue());
        orderRepository.save(order);
    }

    /**
     * 定时任务：关闭过期未支付订单（每分钟检查一次）
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void closeExpiredOrders() {
        List<Order> expired = orderRepository.findByStatusAndExpiredAtBefore(
                OrderStatus.PENDING.getValue(), LocalDateTime.now());
        for (Order order : expired) {
            order.setStatus(OrderStatus.EXPIRED.getValue());
        }
        if (!expired.isEmpty()) {
            orderRepository.saveAll(expired);
        }
    }

    /**
     * 根据订单号查订单（内部方法，供 PayService 使用）
     */
    public Order findByOrderNo(String orderNo) {
        return orderRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
    }

    /**
     * 保存订单（内部方法，供 PayService 更新状态使用）
     */
    public void saveOrder(Order order) {
        orderRepository.save(order);
    }

    private long countUnviewed(Integer userId, OrderDisplayStatus displayStatus, LocalDateTime now) {
        return orderRepository.count(
                buildDisplayStatusSpec(userId, displayStatus, now)
                        .and(unviewedSpec(displayStatus)));
    }

    private Specification<Order> unviewedSpec(OrderDisplayStatus displayStatus) {
        return (root, cq, cb) -> cb.or(
                cb.isNull(root.get("buyerViewedAt")),
                cb.isNull(root.get("buyerViewedStatus")),
                cb.notEqual(root.get("buyerViewedStatus"), displayStatus.name())
        );
    }

    private Specification<Order> buildDisplayStatusSpec(Integer userId, OrderDisplayStatus displayStatus, LocalDateTime now) {
        return (root, cq, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("userId"), userId));
            switch (displayStatus) {
                case PENDING -> predicates.add(cb.and(
                        cb.equal(root.get("status"), OrderStatus.PENDING.getValue()),
                        cb.or(
                                cb.isNull(root.get("expiredAt")),
                                cb.greaterThan(root.get("expiredAt"), now)
                        )
                ));
                case PAYMENT_EXPIRED -> predicates.add(cb.or(
                        cb.equal(root.get("status"), OrderStatus.EXPIRED.getValue()),
                        cb.and(
                                cb.equal(root.get("status"), OrderStatus.PENDING.getValue()),
                                cb.isNotNull(root.get("expiredAt")),
                                cb.lessThanOrEqualTo(root.get("expiredAt"), now)
                        )
                ));
                case COURSE_EXPIRED -> predicates.add(cb.and(
                        cb.equal(root.get("status"), OrderStatus.PAID.getValue()),
                        cb.or(
                                cb.and(
                                        cb.isNotNull(root.get("validUntil")),
                                        cb.lessThanOrEqualTo(root.get("validUntil"), now)
                                ),
                                cb.and(
                                        cb.isNull(root.get("validUntil")),
                                        cb.isNotNull(root.get("paidAt")),
                                        cb.lessThanOrEqualTo(root.get("paidAt"), now.minusYears(1))
                                )
                        )
                ));
                case PAID -> predicates.add(cb.and(
                        cb.equal(root.get("status"), OrderStatus.PAID.getValue()),
                        cb.or(
                                cb.and(
                                        cb.isNotNull(root.get("validUntil")),
                                        cb.greaterThan(root.get("validUntil"), now)
                                ),
                                cb.and(
                                        cb.isNull(root.get("validUntil")),
                                        cb.or(
                                                cb.isNull(root.get("paidAt")),
                                                cb.greaterThan(root.get("paidAt"), now.minusYears(1))
                                        )
                                )
                        )
                ));
                case CANCELLED -> predicates.add(root.get("status").in(
                        OrderStatus.CANCELLED.getValue(),
                        OrderStatus.REFUNDED.getValue()
                ));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    /**
     * 查询订单明细（内部方法，供 PayService 生成报名记录使用）
     */
    public List<OrderItem> findItemsByOrderId(Integer orderId) {
        return orderItemRepository.findByOrderId(orderId);
    }

    private OrderItem buildOrderItem(ProductType productType, Integer productId, int quantity, Integer userId) {
        OrderItem item = new OrderItem();
        item.setProductType(productType);
        item.setProductId(productId);
        int safeQty = Math.max(1, quantity);

        if (productType == ProductType.OPEN_COURSE) {
            Course course = courseRepository.findById(productId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            if (course.getStatus() != 2) {
                throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
            }
            if (course.getIsFree() == 1) {
                throw new BusinessException(ErrorCode.PRODUCT_NOT_PURCHASABLE);
            }
            item.setProductTitle(course.getTitle());
            item.setProductCover(course.getCoverUrl());
            item.setPrice(course.getPrice());
            item.setQuantity(safeQty);
            item.setSubtotal(VideoPurchasePricing.calcSubtotal(course.getPrice(), safeQty, null));
            return item;
        }

        if (productType == ProductType.VIDEO_PACKAGE) {
            VideoPackageGroup group = packageGroupRepository.findById(productId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            int maxQty = VideoPurchasePricing.resolveMaxQuantity(
                    group.getPrice(), group.getCompanyPrice(), group.getMaxPurchaseQty());
            if (maxQty > 0 && safeQty > maxQty) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "购买人数不能超过 " + maxQty + " 人");
            }
            item.setProductTitle(group.getName());
            item.setProductCover("");
            item.setPrice(group.getPrice());
            item.setQuantity(safeQty);
            item.setSubtotal(VideoPurchasePricing.calcSubtotal(
                    group.getPrice(), safeQty,
                    VideoPurchasePricing.resolveCompanyCap(group.getPrice(), group.getCompanyPrice())));
            return item;
        }

        if (productType == ProductType.INTERNAL_COURSE) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_PURCHASABLE);
        }

        Video video = videoRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        if (video.getStatus() != 2) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        if (video.getIsFree() == 1) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_PURCHASABLE);
        }
        if (userId != null && userId.equals(video.getPublisherId())) {
            throw new BusinessException(ErrorCode.CANNOT_BUY_OWN_PRODUCT);
        }
        int maxQty = VideoPurchasePricing.resolveMaxQuantity(
                video.getPrice(), video.getCompanyPrice(), video.getMaxPurchaseQty());
        if (maxQty > 0 && safeQty > maxQty) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "购买人数不能超过 " + maxQty + " 人");
        }
        item.setProductTitle(video.getTitle());
        item.setProductCover(video.getCoverUrl());
        item.setPrice(video.getPrice());
        item.setQuantity(safeQty);
        item.setSubtotal(VideoPurchasePricing.calcSubtotal(
                video.getPrice(), safeQty,
                VideoPurchasePricing.resolveCompanyCap(video.getPrice(), video.getCompanyPrice())));
        return item;
    }

    private String generateOrderNo() {
        String timestamp = LocalDateTime.now().format(ORDER_NO_FMT);
        int randomSuffix = 1000 + RANDOM.nextInt(9000);
        return "TK" + timestamp + randomSuffix;
    }
}
