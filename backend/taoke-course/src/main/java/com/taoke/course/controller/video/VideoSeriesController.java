package com.taoke.course.controller.video;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.video.SaveVideoSeriesRequest;
import com.taoke.course.dto.video.VideoSeriesVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 录播课系列管理接口
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Tag(name = "录播课-系列管理", description = "录播课系列的CRUD操作")
@RestController
@RequiredArgsConstructor
public class VideoSeriesController {

    private final VideoService videoService;

    @Operation(summary = "获取录播课系列列表")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.INSTITUTION})
    @GetMapping("/videos/{videoId}/series")
    public ApiResponse<List<VideoSeriesVO>> list(@PathVariable Integer videoId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.listSeries(videoId, userId));
    }

    @Operation(summary = "创建系列")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.INSTITUTION})
    @PostMapping("/videos/{videoId}/series")
    public ApiResponse<VideoSeriesVO> create(@PathVariable Integer videoId,
                                              @Valid @RequestBody SaveVideoSeriesRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.createSeries(videoId, userId, request));
    }

    @Operation(summary = "编辑系列")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.INSTITUTION})
    @PutMapping("/videos/{videoId}/series/{id}")
    public ApiResponse<VideoSeriesVO> update(@PathVariable Integer videoId,
                                              @PathVariable Integer id,
                                              @Valid @RequestBody SaveVideoSeriesRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.updateSeries(videoId, id, userId, request));
    }

    @Operation(summary = "删除系列")
    @RequireRole({BusinessRole.Code.TRAINER, BusinessRole.Code.INSTITUTION})
    @DeleteMapping("/videos/{videoId}/series/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer videoId,
                                     @PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        videoService.deleteSeries(videoId, id, userId);
        return ApiResponse.ok();
    }
}
