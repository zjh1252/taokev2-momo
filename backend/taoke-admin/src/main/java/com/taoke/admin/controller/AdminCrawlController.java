package com.taoke.admin.controller;

import com.taoke.admin.dto.RejectApplicationRequest;
import com.taoke.admin.dto.crawl.*;
import com.taoke.admin.service.AdminCrawlService;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.RequireRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 后台 - 数据爬取管理（触发爬取 + 审核入库 + 任务管理）。
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Tag(name = "后台-数据爬取管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminCrawlController {

    private final AdminCrawlService adminCrawlService;

    // ==================== 数据源 ====================

    @Operation(summary = "获取可用数据源列表")
    @GetMapping("/admin/crawl/sources")
    public ApiResponse<List<CrawlSourceVO>> listSources() {
        return ApiResponse.ok(adminCrawlService.listSources());
    }

    @Operation(summary = "新增数据源")
    @PostMapping("/admin/crawl/sources")
    public ApiResponse<CrawlSourceVO> createSource(@Valid @RequestBody SaveCrawlSourceRequest request) {
        return ApiResponse.ok(adminCrawlService.createSource(request));
    }

    @Operation(summary = "更新数据源")
    @PutMapping("/admin/crawl/sources/{id}")
    public ApiResponse<CrawlSourceVO> updateSource(@PathVariable Integer id,
                                                   @Valid @RequestBody SaveCrawlSourceRequest request) {
        return ApiResponse.ok(adminCrawlService.updateSource(id, request));
    }

    @Operation(summary = "删除数据源")
    @DeleteMapping("/admin/crawl/sources/{id}")
    public ApiResponse<Void> deleteSource(@PathVariable Integer id) {
        adminCrawlService.deleteSource(id);
        return ApiResponse.ok(null);
    }

    // ==================== 爬虫任务 ====================

    @Operation(summary = "触发爬取任务")
    @PostMapping("/admin/crawl/jobs")
    public ApiResponse<CrawlJobVO> triggerJob(@Valid @RequestBody TriggerCrawlRequest request) {
        return ApiResponse.ok(adminCrawlService.triggerJob(request));
    }

    @Operation(summary = "分页查询爬取任务列表")
    @GetMapping("/admin/crawl/jobs")
    public ApiResponse<PageResult<CrawlJobVO>> listJobs(CrawlJobQuery query) {
        return ApiResponse.ok(adminCrawlService.listJobs(query));
    }

    @Operation(summary = "获取任务详情")
    @GetMapping("/admin/crawl/jobs/{id}")
    public ApiResponse<CrawlJobVO> getJob(@PathVariable Integer id) {
        return ApiResponse.ok(adminCrawlService.getJob(id));
    }

    @Operation(summary = "取消爬取任务")
    @PutMapping("/admin/crawl/jobs/{id}/cancel")
    public ApiResponse<Void> cancelJob(@PathVariable Integer id) {
        adminCrawlService.cancelJob(id);
        return ApiResponse.ok(null);
    }

    // ==================== 爬取专家管理 ====================

    @Operation(summary = "分页查询爬取的专家列表")
    @GetMapping("/admin/crawl/trainers")
    public ApiResponse<PageResult<CrawledTrainerVO>> listCrawledTrainers(CrawledTrainerQuery query) {
        return ApiResponse.ok(adminCrawlService.listCrawledTrainers(query));
    }

    @Operation(summary = "获取爬取专家详情")
    @GetMapping("/admin/crawl/trainers/{id}")
    public ApiResponse<CrawledTrainerDetailVO> getCrawledTrainerDetail(@PathVariable Integer id) {
        return ApiResponse.ok(adminCrawlService.getCrawledTrainerDetail(id));
    }

    @Operation(summary = "审核通过并导入专家")
    @PostMapping("/admin/crawl/trainers/{id}/import")
    public ApiResponse<Integer> importTrainer(@PathVariable Integer id,
                                              @RequestBody(required = false) ImportTrainerRequest edits) {
        return ApiResponse.ok(adminCrawlService.importTrainer(id, edits));
    }

    @Operation(summary = "驳回爬取专家")
    @PutMapping("/admin/crawl/trainers/{id}/reject")
    public ApiResponse<Void> rejectCrawledTrainer(@PathVariable Integer id,
                                                   @Valid @RequestBody RejectApplicationRequest request) {
        adminCrawlService.rejectCrawledTrainer(id, request.getReason());
        return ApiResponse.ok(null);
    }

    // ==================== 爬取课程管理 ====================

    @Operation(summary = "分页查询爬取的课程列表")
    @GetMapping("/admin/crawl/courses")
    public ApiResponse<PageResult<CrawledCourseVO>> listCrawledCourses(CrawledCourseQuery query) {
        return ApiResponse.ok(adminCrawlService.listCrawledCourses(query));
    }

    @Operation(summary = "获取爬取课程详情")
    @GetMapping("/admin/crawl/courses/{id}")
    public ApiResponse<CrawledCourseDetailVO> getCrawledCourseDetail(@PathVariable Integer id) {
        return ApiResponse.ok(adminCrawlService.getCrawledCourseDetail(id));
    }

    @Operation(summary = "保存爬取课程审核修改")
    @PutMapping("/admin/crawl/courses/{id}")
    public ApiResponse<CrawledCourseDetailVO> updateCrawledCourse(@PathVariable Integer id,
                                                                   @RequestBody ImportCourseRequest edits) {
        return ApiResponse.ok(adminCrawlService.updateCrawledCourse(id, edits));
    }

    @Operation(summary = "审核通过并导入课程")
    @PostMapping("/admin/crawl/courses/{id}/import")
    public ApiResponse<Integer> importCourse(@PathVariable Integer id,
                                              @RequestBody(required = false) ImportCourseRequest edits) {
        return ApiResponse.ok(adminCrawlService.importCourse(id, edits));
    }

    @Operation(summary = "驳回爬取课程")
    @PutMapping("/admin/crawl/courses/{id}/reject")
    public ApiResponse<Void> rejectCrawledCourse(@PathVariable Integer id,
                                                   @Valid @RequestBody RejectApplicationRequest request) {
        adminCrawlService.rejectCrawledCourse(id, request.getReason());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "恢复已驳回爬取课程为待审核")
    @PutMapping("/admin/crawl/courses/{id}/restore")
    public ApiResponse<Void> restoreCrawledCourse(@PathVariable Integer id) {
        adminCrawlService.restoreCrawledCourse(id);
        return ApiResponse.ok(null);
    }

    // ==================== Python 服务回调（内部接口） ====================

    @Operation(summary = "爬虫结果回调（供 Python 爬虫服务调用）")
    @Public
    @PostMapping("/internal/crawl/callback")
    public ApiResponse<Void> handleCallback(
            @RequestHeader(value = "X-Crawler-Token", required = false) String token,
            @RequestBody CrawlCallbackRequest request) {
        adminCrawlService.handleCallback(token, request);
        return ApiResponse.ok(null);
    }
}
