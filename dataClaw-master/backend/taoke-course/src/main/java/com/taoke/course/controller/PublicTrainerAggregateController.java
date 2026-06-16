package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import com.taoke.course.api.CourseService;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.video.VideoListItemVO;
import com.taoke.user.api.TrainerService;
import com.taoke.user.entity.Trainer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 专家详情页聚合接口 — 该专家的主讲课程 / 录播课。
 * <p>
 * 放在 taoke-course 模块以避免跨模块循环依赖：内部按 {@code trainerId} 反查
 * {@code user_trainers.user_id}，再以 {@code publisherType=TRAINER AND publisherId=userId}
 * 过滤录播课；课程则直接按 {@code course.trainer_id} 过滤。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 16:00
 */
@Tag(name = "专家详情聚合", description = "专家详情页课程/录播课聚合接口")
@RestController
@RequiredArgsConstructor
public class PublicTrainerAggregateController {

    private final CourseService courseService;
    private final VideoService videoService;
    private final TrainerService trainerService;

    @Public
    @Operation(summary = "专家主讲课程列表（已上架，分页）")
    @GetMapping("/trainers/{id}/courses")
    public ApiResponse<PageResponse<CourseListItemVO>> listCourses(
            @PathVariable("id") Integer trainerId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(courseService.listByTrainer(trainerId, page, size));
    }

    @Public
    @Operation(summary = "专家录播课列表（已上架，分页）")
    @GetMapping("/trainers/{id}/videos")
    public ApiResponse<PageResponse<VideoListItemVO>> listVideos(
            @PathVariable("id") Integer trainerId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Integer userId = resolveTrainerUserId(trainerId);
        if (userId == null) {
            return ApiResponse.ok(PageResponse.of(List.of(), 0, page, size));
        }
        return ApiResponse.ok(videoService.listByTrainerUserId(userId, page, size));
    }

    /** 根据 trainerId 反查 user_id；专家不存在返回 null。 */
    private Integer resolveTrainerUserId(Integer trainerId) {
        if (trainerId == null) return null;
        List<Trainer> list = trainerService.findByIds(List.of(trainerId));
        return list.isEmpty() ? null : list.get(0).getUserId();
    }
}
