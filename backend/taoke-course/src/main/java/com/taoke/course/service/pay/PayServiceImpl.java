package com.taoke.course.service.pay;

import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.video.VideoPurchasedEvent;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.dto.pay.PayRequest;
import com.taoke.course.dto.pay.PayResultVO;
import com.taoke.course.dto.pay.PaymentPrepayResult;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.order.CourseEnrollment;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.entity.pay.Payment;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoEnrollment;
import com.taoke.course.entity.video.VideoPackageGroup;
import com.taoke.course.entity.video.VideoPackageRelation;
import com.taoke.course.entity.video.VideoStudent;
import com.taoke.course.repository.video.VideoStudentRepository;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.PaymentClientType;
import com.taoke.course.enums.PaymentMethod;
import com.taoke.course.enums.PaymentStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.order.CourseEnrollmentRepository;
import com.taoke.course.repository.pay.PaymentRepository;
import com.taoke.course.repository.video.VideoEnrollmentRepository;
import com.taoke.course.repository.video.VideoPackageGroupRepository;
import com.taoke.course.repository.video.VideoPackageRelationRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.service.order.OrderServiceImpl;
import com.taoke.course.service.pay.channel.PaymentChannel;
import com.taoke.course.service.pay.channel.PaymentChannelRegistry;
import com.taoke.user.api.UserService;
import com.taoke.user.dto.user.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;

/**
 * 支付业务实现
 * <p>
 * MOCK 用于开发联调；ALIPAY / WECHAT 走第三方预下单 + 异步回调完成订单。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayServiceImpl {

    private final PaymentRepository paymentRepository;
    private final OrderServiceImpl orderService;
    private final CourseRepository courseRepository;
    private final VideoRepository videoRepository;
    private final VideoPackageGroupRepository packageGroupRepository;
    private final VideoPackageRelationRepository packageRelationRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final VideoEnrollmentRepository videoEnrollmentRepository;
    private final VideoStudentRepository videoStudentRepository;
    private final EventPublisher eventPublisher;
    private final UserService userService;
    private final PaymentChannelRegistry paymentChannelRegistry;

    private static final DateTimeFormatter PAY_NO_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final Random RANDOM = new Random();

    /**
     * 发起支付
     */
    @Transactional
    public PayResultVO pay(Integer userId, PayRequest request) {
        Order order = orderService.findByOrderNo(request.getOrderNo());

        if (!order.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        if (order.getStatus() != OrderStatus.PENDING.getValue()) {
            throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID);
        }
        // 检查是否过期
        if (order.getExpiredAt() != null && order.getExpiredAt().isBefore(LocalDateTime.now())) {
            order.setStatus(OrderStatus.EXPIRED.getValue());
            orderService.saveOrder(order);
            throw new BusinessException(ErrorCode.ORDER_EXPIRED);
        }

        PaymentMethod method = PaymentMethod.valueOf(request.getMethod());
        PaymentClientType clientType = PaymentClientType.from(request.getClientType());

        Payment payment = new Payment();
        payment.setPaymentNo(generatePaymentNo());
        payment.setOrderId(order.getId());
        payment.setOrderNo(order.getOrderNo());
        payment.setUserId(userId);
        payment.setAmount(order.getPayAmount());
        payment.setMethod(method);

        if (method == PaymentMethod.MOCK) {
            // 模拟支付：直接成功
            payment.setStatus(PaymentStatus.SUCCESS.getValue());
            payment.setTradeNo("MOCK_" + payment.getPaymentNo());
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // 完成支付后续流程
            onPaymentSuccess(order, payment);
            return buildPayResultVO(payment, null);
        }

        PaymentChannel channel = paymentChannelRegistry.require(method);
        payment.setStatus(PaymentStatus.PENDING.getValue());
        paymentRepository.save(payment);

        String subject = buildPaySubject(order);
        PaymentPrepayResult prepayResult = channel.prepay(
                payment, order, subject, clientType, request.getOpenId());
        return buildPayResultVO(payment, prepayResult);
    }

    /**
     * 查询支付状态
     */
    public PayResultVO getPaymentStatus(String paymentNo) {
        Payment payment = paymentRepository.findByPaymentNo(paymentNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return buildPayResultVO(payment, null);
    }

    /**
     * 支付成功后的业务处理：更新订单状态、生成报名记录、更新统计计数
     */
    @Transactional
    public void onPaymentSuccess(Order order, Payment payment) {
        // 更新订单为已支付
        order.setStatus(OrderStatus.PAID.getValue());
        order.setPaidAt(payment.getPaidAt());
        orderService.saveOrder(order);

        // 获取订单明细，为每个商品生成报名记录
        List<OrderItem> items = orderService.findItemsByOrderId(order.getId());
        for (OrderItem item : items) {
            createEnrollment(order.getUserId(), order.getId(), item);
        }

        log.info("订单 {} 支付成功，已生成 {} 条报名记录", order.getOrderNo(), items.size());
    }

    private void createEnrollment(Integer userId, Integer orderId, OrderItem item) {
        if (item.getProductType() == ProductType.OPEN_COURSE) {
            // 避免重复报名
            if (courseEnrollmentRepository.existsByCourseIdAndUserIdAndStatus(
                    item.getProductId(), userId, 1)) {
                return;
            }
            LocalDateTime now = LocalDateTime.now();
            CourseEnrollment enrollment = new CourseEnrollment();
            enrollment.setCourseId(item.getProductId());
            enrollment.setUserId(userId);
            enrollment.setOrderId(orderId);
            enrollment.setPricePaid(item.getSubtotal());
            enrollment.setEnrolledAt(now);
            enrollment.setStatus(1);
            courseEnrollmentRepository.save(enrollment);

            // 更新课程报名人数与最近报名时间（近期热度排序使用）
            courseRepository.findById(item.getProductId()).ifPresent(course -> {
                course.setEnrollmentCount(course.getEnrollmentCount() + item.getQuantity());
                course.setLastEnrolledAt(now);
                courseRepository.save(course);
            });

        } else if (item.getProductType() == ProductType.VIDEO_COURSE) {
            createVideoEnrollment(userId, orderId, item.getProductId(), item);
        } else if (item.getProductType() == ProductType.VIDEO_PACKAGE) {
            VideoPackageGroup group = packageGroupRepository.findById(item.getProductId())
                    .orElse(null);
            if (group == null) {
                return;
            }
            List<VideoPackageRelation> relations = packageRelationRepository
                    .findByPackageIdAndTopicIdAndParentIdOrderBySortOrderAscVideoIdAsc(
                            group.getPackageId(), group.getTopicId(), group.getParentId());
            for (VideoPackageRelation relation : relations) {
                createVideoEnrollment(userId, orderId, relation.getVideoId(), item);
            }
        }
    }

    private void createVideoEnrollment(Integer userId, Integer orderId, Integer videoId, OrderItem item) {
        var existing = videoEnrollmentRepository.findByVideoIdAndUserId(videoId, userId);
        if (existing.isPresent() && existing.get().getStatus() != null && existing.get().getStatus() == 1) {
            VideoEnrollment e = existing.get();
            // 已有有效报名且已过期 → 本次支付视为续费，重新计一年有效期；未过期则不重复处理
            if (e.getExpiredAt() != null && e.getExpiredAt().isBefore(LocalDateTime.now())) {
                e.setOrderId(orderId);
                e.setPricePaid(item.getSubtotal());
                e.setEnrolledAt(LocalDateTime.now());
                e.setExpiredAt(LocalDateTime.now().plusYears(1));
                videoEnrollmentRepository.save(e);
            }
            return;
        }
        VideoEnrollment enrollment = new VideoEnrollment();
        enrollment.setVideoId(videoId);
        enrollment.setUserId(userId);
        enrollment.setOrderId(orderId);
        enrollment.setPricePaid(item.getSubtotal());
        enrollment.setEnrolledAt(LocalDateTime.now());
        // 录播课有效期默认一年
        enrollment.setExpiredAt(LocalDateTime.now().plusYears(1));
        enrollment.setStatus(1);
        videoEnrollmentRepository.save(enrollment);

        // 同步创建学员记录（便于后续跟踪学习进度）
        if (!videoStudentRepository.existsByVideoIdAndUserId(videoId, userId)) {
            VideoStudent student = new VideoStudent();
            student.setVideoId(videoId);
            student.setUserId(userId);
            student.setEnrollmentId(enrollment.getId());
            videoStudentRepository.save(student);
        }

        videoRepository.findById(videoId).ifPresent(video -> {
            video.setEnrollmentCount(video.getEnrollmentCount() + item.getQuantity());
            videoRepository.save(video);

            // 发布购买事件，通知课程作者
            try {
                UserProfileResponse buyer = userService.getProfile(userId);
                String buyerName = buyer.getNickname() != null ? buyer.getNickname() : "用户" + userId;
                eventPublisher.publish(new VideoPurchasedEvent(
                        video.getId(), video.getTitle(), video.getPublisherId(),
                        userId, buyerName, item.getSubtotal()
                ));
            } catch (Exception e) {
                log.warn("发布录播课购买事件失败: videoId={}, userId={}", video.getId(), userId, e);
            }
        });
    }

    private String buildPaySubject(Order order) {
        List<OrderItem> items = orderService.findItemsByOrderId(order.getId());
        if (items.isEmpty()) {
            return "淘课网订单-" + order.getOrderNo();
        }
        String title = items.get(0).getProductTitle();
        if (title == null || title.isBlank()) {
            return "淘课网订单-" + order.getOrderNo();
        }
        if (items.size() > 1) {
            return title + " 等" + items.size() + "件商品";
        }
        return title;
    }

    private PayResultVO buildPayResultVO(Payment payment, PaymentPrepayResult prepayResult) {
        PayResultVO vo = new PayResultVO();
        vo.setPaymentNo(payment.getPaymentNo());
        vo.setOrderNo(payment.getOrderNo());
        vo.setAmount(payment.getAmount());
        vo.setMethod(payment.getMethod().name());
        vo.setStatus(payment.getStatus());
        vo.setStatusLabel(PaymentStatus.of(payment.getStatus()).getLabel());
        vo.setPaidAt(payment.getPaidAt());
        if (prepayResult != null) {
            vo.setPayUrl(prepayResult.getPayUrl());
            vo.setQrCodeUrl(prepayResult.getQrCodeUrl());
            vo.setPayParams(prepayResult.getPayParams());
        }
        return vo;
    }

    private String generatePaymentNo() {
        String timestamp = LocalDateTime.now().format(PAY_NO_FMT);
        int randomSuffix = 1000 + RANDOM.nextInt(9000);
        return "PAY" + timestamp + randomSuffix;
    }
}
