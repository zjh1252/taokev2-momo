package com.taoke.course.controller.video;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.video.UpdateProgressRequest;
import com.taoke.course.dto.video.VideoProgressVO;
import com.taoke.course.service.video.VideoProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 录播课学习进度接口（需登录）
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:00
 */
@Tag(name = "录播课-学习进度")
@RestController
@RequiredArgsConstructor
public class VideoProgressController {

    private final VideoProgressService videoProgressService;

    @Operation(summary = "上报章节播放进度")
    @PostMapping("/videos/{videoId}/progress")
    public ApiResponse<Void> updateProgress(@PathVariable Integer videoId,
                                            @Valid @RequestBody UpdateProgressRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        videoProgressService.updateProgress(videoId, request.getChapterId(),
                userId, request.getWatchDuration(), request.getChapterDuration());
        return ApiResponse.ok();
    }

    @Operation(summary = "获取学习进度")
    @GetMapping("/videos/{videoId}/progress")
    public ApiResponse<VideoProgressVO> getProgress(@PathVariable Integer videoId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoProgressService.getProgress(videoId, userId));
    }
}
