package com.taoke.course.service.order;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.order.CreateOrderRequest;
import com.taoke.course.dto.order.OrderVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.cart.Cart;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.entity.video.Video;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.mapper.OrderMapper;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.order.OrderItemRepository;
import com.taoke.course.repository.order.OrderRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.service.cart.CartServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
        order.setExpiredAt(LocalDateTime.now().plusMinutes(30));

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
    public PageResponse<OrderVO> listOrders(Integer userId, Integer status, int page, int size) {
        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Order> orderPage;
        if (status != null) {
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
            return orderMapper.toVO(o, orderItems);
        }).toList();

        return PageResponse.of(voList, orderPage.getTotalElements(), page, size);
    }

    /**
     * 订单详情
     */
    public OrderVO getOrderDetail(Integer userId, String orderNo) {
        Order order = orderRepository.findByOrderNoAndUserId(orderNo, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        return orderMapper.toVO(order, items);
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
        item.setQuantity(quantity);

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
        } else {
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
            item.setProductTitle(video.getTitle());
            item.setProductCover(video.getCoverUrl());
            item.setPrice(video.getPrice());
        }

        item.setSubtotal(item.getPrice().multiply(BigDecimal.valueOf(quantity)));
        return item;
    }

    private String generateOrderNo() {
        String timestamp = LocalDateTime.now().format(ORDER_NO_FMT);
        int randomSuffix = 1000 + RANDOM.nextInt(9000);
        return "TK" + timestamp + randomSuffix;
    }
}
