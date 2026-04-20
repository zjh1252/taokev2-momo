package com.taoke.course.controller.video;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.video.SaveVideoRequest;
import com.taoke.course.dto.video.VideoDetailVO;
import com.taoke.course.dto.video.VideoListItemVO;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.entity.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

/**
 * C 端录播课发布者接口 — 内容管理角色创建、编辑、提交审核、下架、删除录播课
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Tag(name = "录播课-发布者", description = "内容管理角色的录播课管理")
@RestController
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;
    private final UserRoleService userRoleService;

    /** 可发布录播课的角色集合 */
    private static final Set<String> PUBLISHER_ROLES = Set.of(
            BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT,
            BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION,
            BusinessRole.Code.INSTITUTION_EMPLOYEE
    );

    @Operation(summary = "创建录播课（保存为草稿）")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE})
    @PostMapping("/videos")
    public ApiResponse<VideoDetailVO> create(@Valid @RequestBody SaveVideoRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        String publisherType = resolvePublisherType(userId);
        return ApiResponse.ok(videoService.create(userId, publisherType, request));
    }

    @Operation(summary = "编辑录播课")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE})
    @PutMapping("/videos/{id}")
    public ApiResponse<VideoDetailVO> update(@PathVariable Integer id,
                                              @Valid @RequestBody SaveVideoRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.update(id, userId, request));
    }

    @Operation(summary = "我的录播课列表")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE})
    @GetMapping("/videos/me")
    public ApiResponse<PageResponse<VideoListItemVO>> myVideos(
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size) {
        Integer userId = SecurityUtils.getRequiredUserId();
        String publisherType = resolvePublisherType(userId);
        return ApiResponse.ok(videoService.listByPublisher(userId, publisherType, status, keyword, page, size));
    }

    @Operation(summary = "我的录播课详情")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE})
    @GetMapping("/videos/me/{id}")
    public ApiResponse<VideoDetailVO> myDetail(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.getDetailForPublisher(id, userId));
    }

    @Operation(summary = "提交审核")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE})
    @PutMapping("/videos/{id}/submit")
    public ApiResponse<Void> submit(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        videoService.submitForReview(id, userId);
        return ApiResponse.ok();
    }

    @Operation(summary = "下架录播课")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE})
    @PutMapping("/videos/{id}/unpublish")
    public ApiResponse<Void> unpublish(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        videoService.unpublish(id, userId);
        return ApiResponse.ok();
    }

    @Operation(summary = "删除录播课")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.AGENT, BusinessRole.Code.ASSISTANT, BusinessRole.Code.INSTITUTION, BusinessRole.Code.INSTITUTION_EMPLOYEE})
    @DeleteMapping("/videos/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        videoService.delete(id, userId);
        return ApiResponse.ok();
    }

    /**
     * 从当前用户角色中解析发布者类型（优先级：TRAINER > AGENT > ASSISTANT > INSTITUTION > INSTITUTION_EMPLOYEE）
     */
    private String resolvePublisherType(Integer userId) {
        List<UserRole> roles = userRoleService.findByUserId(userId);
        Set<String> activeRoles = new java.util.HashSet<>();
        for (UserRole role : roles) {
            if (role.getStatus() == 1 && PUBLISHER_ROLES.contains(role.getRole())) {
                activeRoles.add(role.getRole());
            }
        }
        if (activeRoles.contains(BusinessRole.Code.TRAINER)) return BusinessRole.Code.TRAINER;
        if (activeRoles.contains(BusinessRole.Code.AGENT)) return BusinessRole.Code.AGENT;
        if (activeRoles.contains(BusinessRole.Code.ASSISTANT)) return BusinessRole.Code.ASSISTANT;
        if (activeRoles.contains(BusinessRole.Code.INSTITUTION)) return BusinessRole.Code.INSTITUTION;
        if (activeRoles.contains(BusinessRole.Code.INSTITUTION_EMPLOYEE)) return BusinessRole.Code.INSTITUTION_EMPLOYEE;
        throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "当前用户无发布录播课的角色");
    }
}
