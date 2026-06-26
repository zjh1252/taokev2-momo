package com.taoke.course.controller.video;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.video.VideoChapterPlaybackVO;
import com.taoke.course.service.video.VideoChapterPlaybackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * 录播课第三方播放签发（中欧 / 快课 / 宽学网 / 思酷）。
 *
 * @author Fangxinxin
 * @date 2026-06-11 10:00
 */
@Tag(name = "录播课-播放签发")
@RestController
@RequiredArgsConstructor
public class VideoPlaybackController {

    private final VideoChapterPlaybackService videoChapterPlaybackService;

    @Operation(summary = "签发章节播放地址（eceibs / kuaike / kuanxue / scho，需登录）")
    @GetMapping("/videos/{videoId}/chapters/{chapterId}/playback-url")
    public ApiResponse<VideoChapterPlaybackVO> signPlaybackUrl(
            @PathVariable Integer videoId,
            @PathVariable Integer chapterId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoChapterPlaybackService.signChapterPlayback(videoId, chapterId, userId));
    }
}
