package com.taoke.course.controller.video;

import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.SecurityUtils;
import com.taoke.common.service.CategoryService;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.video.VideoAccessVO;
import com.taoke.course.dto.video.VideoDetailVO;
import com.taoke.course.dto.video.VideoListItemVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 公开录播课接口 — 无需登录
 * <p>TODO: 正式上线后与 {@link com.taoke.course.service.video.VideoServiceImpl#listPublic} 一致，仅展示已上架录播课；当前测试阶段后端暂不过滤状态。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Tag(name = "录播课-公开", description = "录播课列表/详情（游客可访问）")
@RestController
@RequiredArgsConstructor
public class PublicVideoController {

    private final VideoService videoService;
    private final CategoryService categoryService;

    @Public
    @Operation(summary = "公开录播课列表（分页、分类筛选、关键词搜索、排序、机构筛选）")
    @GetMapping("/videos")
    public ApiResponse<PageResponse<VideoListItemVO>> list(
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer subCategoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) Integer institutionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ApiResponse.ok(videoService.listPublic(categoryId, subCategoryId, keyword, sortBy, institutionId, page, size));
    }

    @Public
    @Operation(summary = "录播课公开详情")
    @GetMapping("/videos/{id}")
    public ApiResponse<VideoDetailVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(videoService.getPublicDetail(id));
    }

    @Operation(summary = "检查录播课访问权限（需登录）")
    @GetMapping("/videos/{id}/access")
    public ApiResponse<VideoAccessVO> checkAccess(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoService.checkAccess(id, userId));
    }

    @Public
    @Operation(summary = "录播课分类树")
    @GetMapping("/videos/categories")
    public ApiResponse<List<CategoryTreeVO>> categoryTree() {
        return ApiResponse.ok(categoryService.getTree("VIDEO_COURSE"));
    }
}
