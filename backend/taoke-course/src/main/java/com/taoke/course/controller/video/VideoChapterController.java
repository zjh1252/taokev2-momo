package com.taoke.course.controller.video;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.video.SaveVideoChapterRequest;
import com.taoke.course.dto.video.VideoChapterVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 录播课章节管理接口
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Tag(name = "录播课-章节管理", description = "录播课章节的CRUD操作")
@RestController
@RequiredArgsConstructor
public class VideoChapterController {

    private final VideoService videoService;

    @Operation(summary = "获取录播课章节列表")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.INSTITUTION})
    @GetMapping("/videos/{videoId}/chapters")
    public ApiResponse<List<VideoChapterVO>> list(@PathVariable Integer videoId,
                                                   @RequestParam(required = false) Integer seriesId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.listChapters(videoId, userId, seriesId));
    }

    @Operation(summary = "创建章节")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.INSTITUTION})
    @PostMapping("/videos/{videoId}/chapters")
    public ApiResponse<VideoChapterVO> create(@PathVariable Integer videoId,
                                               @Valid @RequestBody SaveVideoChapterRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.createChapter(videoId, userId, request));
    }

    @Operation(summary = "批量创建章节")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.INSTITUTION})
    @PostMapping("/videos/{videoId}/chapters/batch")
    public ApiResponse<List<VideoChapterVO>> batchCreate(
            @PathVariable Integer videoId,
            @Valid @RequestBody List<SaveVideoChapterRequest> requests) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.batchCreateChapters(videoId, userId, requests));
    }

    @Operation(summary = "编辑章节")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.INSTITUTION})
    @PutMapping("/videos/{videoId}/chapters/{id}")
    public ApiResponse<VideoChapterVO> update(@PathVariable Integer videoId,
                                               @PathVariable Integer id,
                                               @Valid @RequestBody SaveVideoChapterRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.updateChapter(videoId, id, userId, request));
    }

    @Operation(summary = "删除章节")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.INSTITUTION})
    @DeleteMapping("/videos/{videoId}/chapters/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer videoId,
                                     @PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        videoService.deleteChapter(videoId, id, userId);
        return ApiResponse.ok();
    }
}
