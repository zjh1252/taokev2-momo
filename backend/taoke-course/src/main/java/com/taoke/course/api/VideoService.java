package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.video.*;

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
     * 创建录播课（保存为草稿）
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

    // ==================== 公开接口 ====================

    /**
     * 公开录播课详情（仅已上架）
     */
    VideoDetailVO getPublicDetail(Integer videoId);

    /**
     * 公开录播课列表（仅已上架，支持分页、分类筛选、关键词搜索、排序）
     *
     * @param sortBy 排序方式：default/price/score/time/viewCount/studentCount
     */
    PageResponse<VideoListItemVO> listPublic(Integer categoryId, Integer subCategoryId,
                                              String keyword, String sortBy,
                                              int page, int size);

    // ==================== 系列管理 ====================

    List<VideoSeriesVO> listSeries(Integer videoId, Integer publisherId);

    VideoSeriesVO createSeries(Integer videoId, Integer publisherId, SaveVideoSeriesRequest request);

    VideoSeriesVO updateSeries(Integer videoId, Integer seriesId, Integer publisherId, SaveVideoSeriesRequest request);

    void deleteSeries(Integer videoId, Integer seriesId, Integer publisherId);

    // ==================== 章节管理 ====================

    List<VideoChapterVO> listChapters(Integer videoId, Integer publisherId, Integer seriesId);

    VideoChapterVO createChapter(Integer videoId, Integer publisherId, SaveVideoChapterRequest request);

    VideoChapterVO updateChapter(Integer videoId, Integer chapterId, Integer publisherId, SaveVideoChapterRequest request);

    void deleteChapter(Integer videoId, Integer chapterId, Integer publisherId);
}
