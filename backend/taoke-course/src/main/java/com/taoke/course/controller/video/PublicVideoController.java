package com.taoke.course.controller.video;

import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.SecurityUtils;
import com.taoke.common.service.CategoryService;
import com.taoke.course.api.CourseService;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.video.SubmitVideoCommentRequest;
import com.taoke.course.dto.video.VideoAccessVO;
import com.taoke.course.dto.video.VideoCommentVO;
import com.taoke.course.dto.video.VideoDetailVO;
import com.taoke.course.dto.video.VideoListItemVO;
import com.taoke.course.dto.video.VideoPurchaseOptionsVO;
import com.taoke.course.dto.video.VideoSeriesPackageVO;
import com.taoke.course.service.video.VideoCommentService;
import com.taoke.course.service.video.VideoPackageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
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
    private final CourseService courseService;
    private final VideoCommentService videoCommentService;
    private final VideoPackageService videoPackageService;

    @Public
    @Operation(summary = "公开录播课列表（分页、分类筛选、关键词搜索、排序、机构筛选）")
    @GetMapping("/videos")
    public ApiResponse<PageResponse<VideoListItemVO>> list(
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer subCategoryId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) Integer institutionId,
            @RequestParam(required = false) Integer isFeatured,
            @RequestParam(required = false) Integer isFree,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ApiResponse.ok(videoService.listPublic(
                categoryId, subCategoryId, keyword, sortBy, institutionId, isFeatured,
                isFree, minPrice, maxPrice, page, size,
                SecurityUtils.getCurrentUserId()));
    }

    @Public
    @Operation(summary = "录播课一级分类批量计数（频道底部分类导航）")
    @GetMapping("/videos/category-counts")
    public ApiResponse<java.util.Map<Integer, Long>> categoryCounts() {
        return ApiResponse.ok(videoService.countPublicByCategoryL1());
    }

    @Public
    @Operation(summary = "录播课公开详情；bumpView=1 时仅浏览量 +1")
    @GetMapping("/videos/{id}")
    public ApiResponse<?> detail(
            @PathVariable Integer id,
            @RequestParam(required = false) Boolean bumpView) {
        if (Boolean.TRUE.equals(bumpView)) {
            videoService.incrementViewCount(id);
            return ApiResponse.ok(null);
        }
        return ApiResponse.ok(videoService.getPublicDetail(id));
    }

    @Public
    @Operation(summary = "录播课列表点击浏览量 +1（兼容旧客户端）")
    @PostMapping("/videos/{id}/view")
    public ApiResponse<Void> incrementViewCount(@PathVariable Integer id) {
        videoService.incrementViewCount(id);
        return ApiResponse.ok(null);
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

    @Public
    @Operation(summary = "录播课相关面授课（同分类，优先报名中且热度高）")
    @GetMapping("/videos/{id}/related-courses")
    public ApiResponse<List<CourseListItemVO>> relatedCourses(@PathVariable Integer id) {
        VideoDetailVO video = videoService.getPublicDetail(id);
        return ApiResponse.ok(courseService.listRelatedForVideo(
                video.getCategoryId(), video.getSubCategoryId(), 6));
    }

    @Public
    @Operation(summary = "录播课购买选项（单门/全系列、人数上限）")
    @GetMapping("/videos/{id}/purchase-options")
    public ApiResponse<VideoPurchaseOptionsVO> purchaseOptions(@PathVariable Integer id) {
        return ApiResponse.ok(videoPackageService.getPurchaseOptions(id));
    }

    @Public
    @Operation(summary = "录播课系列介绍（视频包内录播课列表）")
    @GetMapping("/videos/{id}/series-videos")
    public ApiResponse<VideoSeriesPackageVO> seriesVideos(@PathVariable Integer id) {
        VideoSeriesPackageVO result = videoPackageService.getSeriesPackage(id);
        return ApiResponse.ok(result);
    }

    @Public
    @Operation(summary = "录播课评论列表")
    @GetMapping("/videos/{id}/comments")
    public ApiResponse<PageResponse<VideoCommentVO>> listComments(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(videoCommentService.listPublic(id, page - 1, size));
    }

    @Operation(summary = "发表录播课评论（需登录）")
    @PostMapping("/videos/{id}/comments")
    public ApiResponse<Integer> submitComment(
            @PathVariable Integer id,
            @Valid @RequestBody SubmitVideoCommentRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(videoCommentService.submit(userId, id, request));
    }
}
