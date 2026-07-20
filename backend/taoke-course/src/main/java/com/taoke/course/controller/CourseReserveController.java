package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.reserve.CourseEnrollmentStatusVO;
import com.taoke.course.dto.reserve.CoursePayReserveRequest;
import com.taoke.course.dto.reserve.CourseReserveStatusVO;
import com.taoke.course.repository.order.CourseEnrollmentRepository;
import com.taoke.course.service.CourseReserveService;
import com.taoke.course.service.OrderPurchaseNotifyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 线上公开课预约接口
 *
 * @author Fangxinxin
 * @date 2026-07-16 15:15
 */
@Tag(name = "课程-预约", description = "线上公开课免费预约与支付后预约通知")
@RestController
@RequiredArgsConstructor
public class CourseReserveController {

    private final CourseReserveService courseReserveService;
    private final OrderPurchaseNotifyService orderPurchaseNotifyService;
    private final CourseEnrollmentRepository courseEnrollmentRepository;

    @Operation(summary = "查询当前用户对课程的预约状态")
    @GetMapping("/courses/{courseId}/reserve-status")
    public ApiResponse<CourseReserveStatusVO> reserveStatus(@PathVariable Integer courseId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(courseReserveService.getReserveStatus(userId, courseId));
    }

    @Public
    @Operation(summary = "查询当前用户是否已购买/报名该课程（未登录视为未购买）")
    @GetMapping("/courses/{courseId}/enrollment-status")
    public ApiResponse<CourseEnrollmentStatusVO> enrollmentStatus(@PathVariable Integer courseId) {
        CourseEnrollmentStatusVO vo = new CourseEnrollmentStatusVO();
        Integer userId = SecurityUtils.getCurrentUserId();
        vo.setEnrolled(userId != null
                && courseEnrollmentRepository.existsByCourseIdAndUserIdAndStatus(courseId, userId, 1));
        return ApiResponse.ok(vo);
    }

    @Operation(summary = "免费线上公开课预约")
    @PostMapping("/courses/{courseId}/reserves")
    public ApiResponse<Void> reserveFree(@PathVariable Integer courseId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        courseReserveService.reserveFree(userId, courseId);
        return ApiResponse.ok();
    }

    @Operation(summary = "支付成功后补发订单内全部商品购买通知（前端双保险）")
    @PostMapping("/courses/reserves/pay")
    public ApiResponse<Void> reserveAfterPay(@Valid @RequestBody CoursePayReserveRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        // 兼容旧入参：按整单补发，覆盖公开课/录播课等全部商品
        orderPurchaseNotifyService.notifyPaidOrderByOrderNo(userId, request.getOrderNo());
        return ApiResponse.ok();
    }
}
