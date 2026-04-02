package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.course.SaveCourseRequest;
import com.taoke.course.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 课程管理能力接口
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
public interface CourseService {

    // ==================== C 端发布者操作 ====================

    /**
     * 创建课程（保存为草稿）
     *
     * @param publisherId   发布者用户 ID
     * @param publisherType 发布者类型：TRAINER / INSTITUTION
     * @param request       课程请求体
     * @return 课程详情
     */
    CourseDetailVO create(Integer publisherId, String publisherType, SaveCourseRequest request);

    /**
     * 编辑课程（仅草稿/驳回状态可编辑）
     *
     * @param courseId    课程 ID
     * @param publisherId 当前发布者 ID（权限校验）
     * @param request     课程请求体
     * @return 课程详情
     */
    CourseDetailVO update(Integer courseId, Integer publisherId, SaveCourseRequest request);

    /**
     * 提交审核
     */
    void submitForReview(Integer courseId, Integer publisherId);

    /**
     * 发布者下架自己的课程
     */
    void unpublish(Integer courseId, Integer publisherId);

    /**
     * 删除课程（仅草稿/驳回状态可删除）
     */
    void delete(Integer courseId, Integer publisherId);

    /**
     * 课程详情（发布者查看自己的课程）
     */
    CourseDetailVO getDetailForPublisher(Integer courseId, Integer publisherId);

    /**
     * 我的课程列表
     */
    PageResponse<CourseListItemVO> listByPublisher(Integer publisherId, String publisherType,
                                                    Integer status, String keyword,
                                                    int page, int size);

    // ==================== 公开接口 ====================

    /**
     * 公开课程详情（仅已上架）
     */
    CourseDetailVO getPublicDetail(Integer courseId);

    /**
     * 公开课程列表（仅已上架，支持分页、分类筛选、关键词搜索、排序）
     *
     * @param isOpen true=公开课(OPEN_OFFLINE/OPEN_ONLINE)，false=内训课(INTERNAL)，null=全部
     * @param sortBy 排序方式：default=默认(权重+上线时间), price=价格升序, score=评分降序, time=上线时间降序, viewCount=人气降序
     */
    PageResponse<CourseListItemVO> listPublic(Integer categoryId, Integer subCategoryId,
                                              String type, Boolean isOpen, String keyword,
                                              String sortBy, int page, int size);

    // ==================== 后台管理 ====================

    /**
     * 后台分页搜索课程
     */
    Page<Course> searchForAdmin(String keyword, Integer status, String type, Pageable pageable);

    /**
     * 后台课程详情
     */
    CourseDetailVO getDetailForAdmin(Integer courseId);

    /**
     * 审核通过
     */
    void approve(Integer courseId);

    /**
     * 审核驳回
     */
    void reject(Integer courseId, String reason);

    /**
     * 后台下架
     */
    void adminUnpublish(Integer courseId);

    /**
     * 设为/取消主打课程
     */
    void toggleFeatured(Integer courseId);

    /**
     * 检查是否有课程引用了指定分类
     */
    boolean hasCategoryReference(Integer categoryId);
}
