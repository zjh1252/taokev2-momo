package com.taoke.admin.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.order.OrderRepository;
import com.taoke.user.repository.TrainerRepository;
import com.taoke.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 后台 — 首页概览统计数据
 *
 * @author Fangxinxin
 * @date 2026-04-13 16:00
 */
@Tag(name = "后台-概览统计")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminStatsController {

    private final UserRepository userRepository;
    private final TrainerRepository trainerRepository;
    private final CourseRepository courseRepository;
    private final OrderRepository orderRepository;

    @Operation(summary = "概览统计数据")
    @GetMapping("/admin/stats/overview")
    public ApiResponse<Map<String, Object>> overview() {
        LocalDateTime todayStart = LocalDate.now().atTime(LocalTime.MIN);
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atTime(LocalTime.MIN);

        long totalUsers = userRepository.count();
        long todayUsers = userRepository.countByCreatedAtAfter(todayStart);
        long monthUsers = userRepository.countByCreatedAtAfter(monthStart);

        long totalTrainers = trainerRepository.countByStatus(2);
        long todayTrainers = trainerRepository.countByStatusAndApprovedAtAfter(2, todayStart);
        long monthTrainers = trainerRepository.countByStatusAndApprovedAtAfter(2, monthStart);

        long totalCourses = courseRepository.count();
        long todayCourses = courseRepository.countByCreatedAtAfter(todayStart);
        long monthCourses = courseRepository.countByCreatedAtAfter(monthStart);

        long totalOrders = orderRepository.count();
        long todayOrders = orderRepository.countByCreatedAtAfter(todayStart);
        long monthOrders = orderRepository.countByCreatedAtAfter(monthStart);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalUsers", totalUsers);
        data.put("todayUsers", todayUsers);
        data.put("monthUsers", monthUsers);
        data.put("totalTrainers", totalTrainers);
        data.put("todayTrainers", todayTrainers);
        data.put("monthTrainers", monthTrainers);
        data.put("totalCourses", totalCourses);
        data.put("todayCourses", todayCourses);
        data.put("monthCourses", monthCourses);
        data.put("totalOrders", totalOrders);
        data.put("todayOrders", todayOrders);
        data.put("monthOrders", monthOrders);

        return ApiResponse.ok(data);
    }
}
