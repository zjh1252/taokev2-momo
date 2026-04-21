package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.video.*;
import com.taoke.course.dto.video.VideoAccessVO;

import java.util.List;

/**
 * 录播课管理能力接口
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
public interface VideoService {

    // ==================== C 端发布者操作 ====================

    /**
     * 创建录播课（直接进入待审核状态）
     */
    VideoDetailVO create(Integer publisherId, String publisherType, SaveVideoRequest request);

    /**
     * 编辑录播课（仅草稿/驳回状态可编辑）
     */
    VideoDetailVO update(Integer videoId, Integer publisherId, SaveVideoRequest request);

    /**
     * 提交审核
     */
    void submitForReview(Integer videoId, Integer publisherId);

    /**
     * 发布者下架自己的录播课
     */
    void unpublish(Integer videoId, Integer publisherId);

    /**
     * 删除录播课（仅草稿/驳回状态可删除）
     */
    void delete(Integer videoId, Integer publisherId);

    /**
     * 录播课详情（发布者查看自己的录播课）
     */
    VideoDetailVO getDetailForPublisher(Integer videoId, Integer publisherId);

    /**
     * 我的录播课列表
     */
    PageResponse<VideoListItemVO> listByPublisher(Integer publisherId, String publisherType,
                                                   Integer status, String keyword,
                                                   int page, int size);

    // ==================== 访问权限 ====================

    /**
     * 检查用户对录播课的访问权限（免费/已购买未过期）
     */
    VideoAccessVO checkAccess(Integer videoId, Integer userId);

    // ==================== 公开接口 ====================

    /**
     * 公开录播课详情（仅已上架）
     */
    VideoDetailVO getPublicDetail(Integer videoId);

    /**
     * 公开录播课列表（仅已上架，支持分页、分类筛选、关键词搜索、排序、机构筛选）
     *
     * @param sortBy        排序方式：default/price/score/time/viewCount/studentCount
     * @param institutionId 机构 ID，传入后仅返回 publisherType=INSTITUTION AND publisherId=institution.userId 的录播课；机构不存在返回空页
     */
    PageResponse<VideoListItemVO> listPublic(Integer categoryId, Integer subCategoryId,
                                              String keyword, String sortBy,
                                              Integer institutionId,
                                              int page, int size);

    /**
     * 机构详情页：分页拉取该机构发布的录播课，按 publishedAt DESC 排序。
     */
    PageResponse<VideoListItemVO> listByInstitution(Integer institutionId, int page, int size);

    /**
     * 机构详情页右侧栏：机构录播课（最多 6 条），按 publishedAt DESC 排序。
     */
    List<VideoListItemVO> listInstitutionSidebarVideos(Integer institutionId);

    /**
     * 专家详情页：按专家 user_id 拉取其发布的录播课，分页，按 publishedAt DESC 排序。
     *
     * @param trainerUserId 专家所属的 user_id（注意：不是 user_trainers.id）
     */
    PageResponse<VideoListItemVO> listByTrainerUserId(Integer trainerUserId, int page, int size);

    // ==================== 后台管理 ====================

    /**
     * 后台分页查询录播课列表
     */
    PageResponse<VideoListItemVO> listForAdmin(Integer status, String keyword, int page, int size);

    /**
     * 后台录播课详情（无状态限制）
     */
    VideoDetailVO getAdminDetail(Integer videoId);

    /**
     * 审核通过（PENDING → PUBLISHED）
     */
    void approve(Integer videoId);

    /**
     * 审核驳回（PENDING → REJECTED）
     */
    void reject(Integer videoId, String reason);

    /**
     * 后台下架（PUBLISHED → UNPUBLISHED）
     */
    void adminUnpublish(Integer videoId);

    /**
     * 后台重新上架（UNPUBLISHED → PUBLISHED）
     */
    void adminPublish(Integer videoId);

    // ==================== 系列管理 ====================

    List<VideoSeriesVO> listSeries(Integer videoId, Integer publisherId);

    VideoSeriesVO createSeries(Integer videoId, Integer publisherId, SaveVideoSeriesRequest request);

    VideoSeriesVO updateSeries(Integer videoId, Integer seriesId, Integer publisherId, SaveVideoSeriesRequest request);

    void deleteSeries(Integer videoId, Integer seriesId, Integer publisherId);

    // ==================== 章节管理 ====================

    List<VideoChapterVO> listChapters(Integer videoId, Integer publisherId, Integer seriesId);

    VideoChapterVO createChapter(Integer videoId, Integer publisherId, SaveVideoChapterRequest request);

    /**
     * 批量创建章节（SERIES类型，前端上传多个视频后一次性创建）
     */
    List<VideoChapterVO> batchCreateChapters(Integer videoId, Integer publisherId, List<SaveVideoChapterRequest> requests);

    VideoChapterVO updateChapter(Integer videoId, Integer chapterId, Integer publisherId, SaveVideoChapterRequest request);

    void deleteChapter(Integer videoId, Integer chapterId, Integer publisherId);
}
