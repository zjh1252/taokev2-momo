package com.taoke.course.service;

import com.taoke.common.enums.NotificationType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.service.RegionService;
import com.taoke.course.dto.reserve.CourseReserveStatusVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.entity.CourseReserve;
import com.taoke.course.entity.order.Order;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.CourseType;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.CourseReserveRepository;
import com.taoke.course.service.order.OrderServiceImpl;
import com.taoke.course.support.OpenCourseExpireSupport;
import com.taoke.user.api.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 公开课预约服务（免费预约 / 付费购买后通知）
 *
 * @author Fangxinxin
 * @date 2026-07-16 15:15
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CourseReserveService {

    private static final int RESERVE_ACTIVE = 1;
    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final CourseRepository courseRepository;
    private final CoursePlanRepository coursePlanRepository;
    private final CourseReserveRepository courseReserveRepository;
    private final OrderServiceImpl orderService;
    private final NotificationService notificationService;
    private final RegionService regionService;

    public CourseReserveStatusVO getReserveStatus(Integer userId, Integer courseId) {
        CourseReserveStatusVO vo = new CourseReserveStatusVO();
        vo.setReserved(courseReserveRepository.existsByUserIdAndCourseIdAndReserveStatus(
                userId, courseId, RESERVE_ACTIVE));
        return vo;
    }

    @Transactional
    public void reserveFree(Integer userId, Integer courseId) {
        Course course = loadReservableOnlineCourse(courseId);
        if (course.getIsFree() == null || course.getIsFree() != 1) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅免费线上公开课支持直接预约");
        }
        createReserveAndNotify(userId, course, 0, true);
    }

    @Transactional
    public void reserveAfterPayment(Integer userId, Integer courseId, Integer orderId) {
        Course course = courseRepository.findById(courseId).orElse(null);
        if (course == null) {
            log.warn("支付后预约跳过：课程不存在 courseId={}", courseId);
            return;
        }
        if (course.getType() == null || !course.getType().isOpen()) {
            log.warn("支付后预约跳过：非公开课 courseId={}, type={}", courseId, course.getType());
            return;
        }
        createReserveAndNotify(userId, course, orderId, false);
    }

    @Transactional
    public void reserveAfterPaymentByOrderNo(Integer userId, String orderNo, Integer courseId) {
        Order order = orderService.findByOrderNo(orderNo);
        if (!order.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ORDER_NOT_FOUND);
        }
        if (order.getStatus() != OrderStatus.PAID.getValue()) {
            throw new BusinessException(ErrorCode.ORDER_STATUS_INVALID, "订单尚未支付成功");
        }
        boolean orderContainsCourse = orderService.findItemsByOrderId(order.getId()).stream()
                .anyMatch(item -> item.getProductType() == ProductType.OPEN_COURSE
                        && item.getProductId().equals(courseId));
        if (!orderContainsCourse) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "订单与课程不匹配");
        }
        reserveAfterPayment(userId, courseId, order.getId());
    }

    private void createReserveAndNotify(Integer userId, Course course, Integer orderId, boolean freeReserve) {
        boolean alreadyReserved = courseReserveRepository.existsByUserIdAndCourseIdAndReserveStatus(
                userId, course.getId(), RESERVE_ACTIVE);
        if (alreadyReserved && freeReserve) {
            throw new BusinessException(ErrorCode.COURSE_ALREADY_RESERVED);
        }

        CoursePlan plan = findPrimaryPlan(course.getId());
        if (freeReserve) {
            if (plan == null) {
                throw new BusinessException(ErrorCode.COURSE_PLAN_REQUIRED);
            }
            if (plan.getOnlineUrl() == null || plan.getOnlineUrl().isBlank()) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "课程尚未配置直播链接，暂无法预约");
            }
        }

        if (!alreadyReserved) {
            LocalDateTime now = LocalDateTime.now();
            CourseReserve reserve = new CourseReserve();
            reserve.setUserId(userId);
            reserve.setCourseId(course.getId());
            reserve.setOrderId(orderId != null ? orderId : 0);
            reserve.setReserveStatus(RESERVE_ACTIVE);
            reserve.setReservedAt(now);
            courseReserveRepository.save(reserve);
        }

        String relatedId = freeReserve
                ? String.valueOf(course.getId())
                : OrderPurchaseNotifyService.buildPurchaseRelatedId(
                        orderId, ProductType.OPEN_COURSE, course.getId());
        if (notificationService.exists(userId, NotificationType.COURSE_RESERVE, relatedId)) {
            log.info("公开课购买/预约通知已存在，跳过: userId={}, relatedId={}", userId, relatedId);
            return;
        }

        sendPurchaseOrReserveNotification(userId, course, freeReserve, relatedId);
        log.info("公开课预约通知已发送: userId={}, courseId={}, free={}, type={}",
                userId, course.getId(), freeReserve, course.getType());
    }

    private void sendPurchaseOrReserveNotification(
            Integer userId, Course course, boolean freeReserve, String relatedId) {
        CoursePlan plan = findPrimaryPlan(course.getId());
        String titlePrefix = freeReserve ? "预约成功" : "购买成功";
        String courseTypeLabel = course.getType() == CourseType.OPEN_ONLINE ? "线上公开课" : "线下公开课";
        String title = String.format("【%s】%s%s", titlePrefix, course.getTitle(), courseTypeLabel);
        String content = buildNotificationContent(course, plan);
        String relatedUrl = "/opencourse/" + course.getId() + ".htm";

        notificationService.send(
                userId,
                NotificationType.COURSE_RESERVE,
                title,
                content,
                relatedId,
                relatedUrl);
    }

    private Course loadReservableOnlineCourse(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        if (course.getStatus() != CourseStatus.PUBLISHED.getValue()) {
            throw new BusinessException(ErrorCode.COURSE_NOT_FOUND);
        }
        if (course.getType() != CourseType.OPEN_ONLINE) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅线上公开课支持预约");
        }
        if (OpenCourseExpireSupport.isOverdue(course)) {
            throw new BusinessException(ErrorCode.COURSE_STATUS_INVALID, "课程已结束，无法预约");
        }
        return course;
    }

    private CoursePlan findPrimaryPlan(Integer courseId) {
        List<CoursePlan> plans = coursePlanRepository.findByCourseIdOrderBySortOrder(courseId);
        return plans.isEmpty() ? null : plans.get(0);
    }

    private String buildNotificationContent(Course course, CoursePlan plan) {
        if (course.getType() == CourseType.OPEN_ONLINE) {
            String start = plan != null && plan.getStartTime() != null ? plan.getStartTime().format(DT_FMT) : "-";
            String end = plan != null && plan.getEndTime() != null ? plan.getEndTime().format(DT_FMT) : "-";
            String liveUrl = plan != null && plan.getOnlineUrl() != null ? plan.getOnlineUrl().trim() : "-";
            return String.join("\n",
                    "线上公开课预约成功通知",
                    "课程名称：" + course.getTitle(),
                    "开课时间段：" + start + " ~ " + end,
                    "上课地点：线上",
                    "直播会议链接：" + liveUrl);
        }

        String start = plan != null && plan.getStartTime() != null ? plan.getStartTime().format(DT_FMT) : "-";
        String end = plan != null && plan.getEndTime() != null ? plan.getEndTime().format(DT_FMT) : "-";
        String location = plan != null ? formatPlanLocation(plan) : null;
        return String.join("\n",
                "线下公开课报名成功通知",
                "课程名称：" + course.getTitle(),
                "开课时间段：" + start + " ~ " + end,
                "上课地点：" + (location != null && !location.isBlank() ? location : "-"));
    }

    private String formatPlanLocation(CoursePlan plan) {
        if (plan.getAddress() != null && !plan.getAddress().isBlank()) {
            return plan.getAddress().trim();
        }
        Set<Integer> regionIds = new HashSet<>();
        if (plan.getProvinceId() != null && plan.getProvinceId() > 0) {
            regionIds.add(plan.getProvinceId());
        }
        if (plan.getCityId() != null && plan.getCityId() > 0) {
            regionIds.add(plan.getCityId());
        }
        if (plan.getDistrictId() != null && plan.getDistrictId() > 0) {
            regionIds.add(plan.getDistrictId());
        }
        Map<Integer, String> regionNameMap = regionIds.isEmpty()
                ? Map.of()
                : regionService.getNamesByIds(regionIds);
        String province = plan.getProvinceId() != null && plan.getProvinceId() > 0
                ? regionNameMap.get(plan.getProvinceId()) : null;
        String city = plan.getCityId() != null && plan.getCityId() > 0
                ? regionNameMap.get(plan.getCityId()) : null;
        if (province != null && city != null && !province.equals(city)) {
            return province + " " + city;
        }
        if (city != null) {
            return city;
        }
        if (province != null) {
            return province;
        }
        return null;
    }
}
