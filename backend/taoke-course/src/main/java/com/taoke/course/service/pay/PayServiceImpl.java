package com.taoke.course.service.pay;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.dto.pay.PayRequest;
import com.taoke.course.dto.pay.PayResultVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.order.CourseEnrollment;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.entity.pay.Payment;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoEnrollment;
import com.taoke.course.entity.video.VideoStudent;
import com.taoke.course.repository.video.VideoStudentRepository;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.PaymentMethod;
import com.taoke.course.enums.PaymentStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.order.CourseEnrollmentRepository;
import com.taoke.course.repository.pay.PaymentRepository;
import com.taoke.course.repository.video.VideoEnrollmentRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.service.order.OrderServiceImpl;
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
 * 第一期仅实现模拟支付：发起后立即标记为成功，并完成后续报名流程。
 * 后续对接支付宝/微信时，在此扩展异步回调逻辑。
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
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final VideoEnrollmentRepository videoEnrollmentRepository;
    private final VideoStudentRepository videoStudentRepository;

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
        } else {
            // TODO: 接入真实支付渠道（支付宝、微信），异步等待回调
            payment.setStatus(PaymentStatus.PENDING.getValue());
            paymentRepository.save(payment);
        }

        return buildPayResultVO(payment);
    }

    /**
     * 查询支付状态
     */
    public PayResultVO getPaymentStatus(String paymentNo) {
        Payment payment = paymentRepository.findByPaymentNo(paymentNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return buildPayResultVO(payment);
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
            CourseEnrollment enrollment = new CourseEnrollment();
            enrollment.setCourseId(item.getProductId());
            enrollment.setUserId(userId);
            enrollment.setOrderId(orderId);
            enrollment.setPricePaid(item.getSubtotal());
            enrollment.setEnrolledAt(LocalDateTime.now());
            enrollment.setStatus(1);
            courseEnrollmentRepository.save(enrollment);

            // 更新课程报名人数
            courseRepository.findById(item.getProductId()).ifPresent(course -> {
                course.setEnrollmentCount(course.getEnrollmentCount() + item.getQuantity());
                courseRepository.save(course);
            });

        } else if (item.getProductType() == ProductType.VIDEO_COURSE) {
            if (videoEnrollmentRepository.existsByVideoIdAndUserIdAndStatus(
                    item.getProductId(), userId, 1)) {
                return;
            }
            VideoEnrollment enrollment = new VideoEnrollment();
            enrollment.setVideoId(item.getProductId());
            enrollment.setUserId(userId);
            enrollment.setOrderId(orderId);
            enrollment.setPricePaid(item.getSubtotal());
            enrollment.setEnrolledAt(LocalDateTime.now());
            // 录播课有效期默认一年
            enrollment.setExpiredAt(LocalDateTime.now().plusYears(1));
            enrollment.setStatus(1);
            videoEnrollmentRepository.save(enrollment);

            // 同步创建学员记录（便于后续跟踪学习进度）
            if (!videoStudentRepository.existsByVideoIdAndUserId(item.getProductId(), userId)) {
                VideoStudent student = new VideoStudent();
                student.setVideoId(item.getProductId());
                student.setUserId(userId);
                student.setEnrollmentId(enrollment.getId());
                videoStudentRepository.save(student);
            }

            videoRepository.findById(item.getProductId()).ifPresent(video -> {
                video.setEnrollmentCount(video.getEnrollmentCount() + item.getQuantity());
                videoRepository.save(video);
            });
        }
    }

    private PayResultVO buildPayResultVO(Payment payment) {
        PayResultVO vo = new PayResultVO();
        vo.setPaymentNo(payment.getPaymentNo());
        vo.setOrderNo(payment.getOrderNo());
        vo.setAmount(payment.getAmount());
        vo.setMethod(payment.getMethod().name());
        vo.setStatus(payment.getStatus());
        vo.setStatusLabel(PaymentStatus.of(payment.getStatus()).getLabel());
        vo.setPaidAt(payment.getPaidAt());
        return vo;
    }

    private String generatePaymentNo() {
        String timestamp = LocalDateTime.now().format(PAY_NO_FMT);
        int randomSuffix = 1000 + RANDOM.nextInt(9000);
        return "PAY" + timestamp + randomSuffix;
    }
}
