package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.course.PublicCourseQuery;
import com.taoke.course.dto.course.RecommendedCourseVO;
import com.taoke.course.dto.course.SaveCourseRequest;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

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
     * 列表页点击看过/人气 +1（仅已上架课程）
     */
    void incrementViewCount(Integer courseId);

    /**
     * 公开课程列表（仅已上架）。
     *
     * <p>支持如下过滤维度（详见 {@link PublicCourseQuery}）：</p>
     * <ul>
     *   <li>分类 / 类型 / 公开课开关 / 关键词 / 机构</li>
     *   <li>开课计划维度：开课省/市、开课时间范围（或 timeQuick 快捷段）</li>
     *   <li>价格维度：priceMin / priceMax / isFree</li>
     *   <li>报名状态：ENROLLING（存在未来开课计划） / ENDED（无未来开课计划）</li>
     *   <li>排序方式 + 分页</li>
     * </ul>
     */
    PageResponse<CourseListItemVO> listPublic(PublicCourseQuery query);

    /**
     * 已上架课程按一级分类批量计数（频道底部分类导航，单次查询替代 N 次 listPublic）。
     *
     * @param isOpen   true=公开课，false=内训课
     * @param cityIds  可选；传入时仅统计在这些城市有开课计划的公开课
     * @return key=一级分类 ID，value=课程数
     */
    java.util.Map<Integer, Long> countPublicByCategoryL1(boolean isOpen, List<Integer> cityIds);

    /**
     * 专家详情页推荐课程
     * <p>规则：trainer_id = trainerId AND status = 已上架，按 view_count DESC 排序，最多 3 条。</p>
     *
     * @param trainerId 专家主表 ID（user_trainers.id）
     */
    List<RecommendedCourseVO> listRecommendedByTrainer(Integer trainerId);

    /**
     * 机构详情页：分页拉取该机构旗下的「公开课」或「内训课」
     *
     * @param institutionId 机构 ID（user_institutions.id）
     * @param type          OPEN=公开课（含线上/线下），INNER=内训课
     * @param page          页码，从 1 开始
     * @param size          每页条数
     */
    PageResponse<CourseListItemVO> listByInstitution(Integer institutionId, String type, int page, int size);

    /**
     * 机构详情页右侧栏：机构公开课（最多 6 条），按 last_enrolled_at DESC, view_count DESC 排序。
     */
    List<CourseListItemVO> listInstitutionSidebarOpenCourses(Integer institutionId);

    /**
     * 机构详情页右侧栏：全平台「热门公开课」（最多 5 条），按 last_enrolled_at DESC, created_at DESC 排序。
     */
    List<CourseListItemVO> listHotOpenCourses();

    /**
     * 专家详情页：按专家 ID 拉取其所有已上架课程（公开课 + 内训课），分页。
     *
     * @param trainerId 专家 ID（user_trainers.id）
     * @param page      页码，从 1 开始
     * @param size      每页条数
     */
    PageResponse<CourseListItemVO> listByTrainer(Integer trainerId, int page, int size);

    // ==================== 后台管理 ====================

    /**
     * 后台分页搜索课程
     */
    Page<Course> searchForAdmin(String keyword, Integer status, String type,
                               Integer trainerId, String publisherType, Integer publisherId,
                               java.util.Collection<Integer> publisherUserIds,
                               Pageable pageable);

    /**
     * 批量统计发布者课程数
     */
    java.util.Map<Integer, Long> countByPublisherIds(java.util.Collection<Integer> publisherIds);

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

    /**
     * 后台分页查询排课计划
     */
    Page<CoursePlan> searchPlansForAdmin(Integer courseId, String keyword, Pageable pageable);

    /**
     * 根据 ID 集合批量获取课程
     */
    List<Course> findByIds(Set<Integer> ids);

    /**
     * 批量组装课程列表项（含分类名、排期、发布者等展示字段）
     */
    List<CourseListItemVO> assembleListItems(List<Course> courses);

    /**
     * 批量组装课程列表项；{@code displayPlanProvinceIds}/{@code displayPlanCityIds} 非空时，
     * 公开课展示排期优先取命中筛选条件的场次（避免筛北京却展示上海最近一场）。
     */
    List<CourseListItemVO> assembleListItems(List<Course> courses,
                                             List<Integer> displayPlanProvinceIds,
                                             List<Integer> displayPlanCityIds);

    /**
     * 录播课详情页相关面授课：同分类公开课+内训课，优先仍可报名且热度高
     */
    List<CourseListItemVO> listRelatedForVideo(Integer categoryId, Integer subCategoryId, int limit);
}
