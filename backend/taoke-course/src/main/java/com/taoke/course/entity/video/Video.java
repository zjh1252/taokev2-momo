package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import com.taoke.course.enums.VideoStatus;
import com.taoke.course.enums.VideoType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 录播课主表实体 — 对应 videos 表
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "videos")
public class Video extends BaseEntity {

    /** 发布者用户ID */
    @Column(name = "publisher_id", nullable = false)
    private Integer publisherId;

    /** 发布者类型：TRAINER / INSTITUTION */
    @Column(name = "publisher_type", nullable = false, length = 20)
    private String publisherType;

    /** 录播课标题 */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /** 封面图URL */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** 课程介绍（富文本HTML） */
    @Column(name = "intro", columnDefinition = "longtext")
    private String intro;

    /** 视频类型 */
    @Enumerated(EnumType.STRING)
    @Column(name = "video_type", nullable = false, length = 20)
    private VideoType videoType = VideoType.SERIES;

    /** 视频地址（SINGLE类型时使用） */
    @Column(name = "video_url", length = 500)
    private String videoUrl;

    /** 外部链接（EXTERNAL类型时使用） */
    @Column(name = "external_url", length = 500)
    private String externalUrl;

    /** 一级分类ID */
    @Column(name = "category_id")
    private Integer categoryId = 0;

    /** 二级分类ID */
    @Column(name = "sub_category_id")
    private Integer subCategoryId = 0;

    /** 授课老师 */
    @Column(name = "teacher_name", length = 100)
    private String teacherName;

    /** 关联讲师ID */
    @Column(name = "trainer_id")
    private Integer trainerId = 0;

    /** 课程价格 */
    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    /** 企业采购封顶价（元） */
    @Column(name = "company_price", precision = 10, scale = 2)
    private BigDecimal companyPrice = BigDecimal.ZERO;

    /** 单次最多购买人数 */
    @Column(name = "max_purchase_qty", nullable = false)
    private Integer maxPurchaseQty = 20;

    /** 原价（划线价） */
    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice = BigDecimal.ZERO;

    /** 是否免费：0=否 1=是 */
    @Column(name = "is_free", nullable = false, columnDefinition = "tinyint")
    private Integer isFree = 0;

    /** 封顶人数：0=不限（不封顶） */
    @Column(name = "cap_count", nullable = false)
    private Integer capCount = 0;

    /** 封顶价（批量采购优惠价，单价×封顶人数），NULL=不设置 */
    @Column(name = "cap_price", precision = 10, scale = 2)
    private BigDecimal capPrice;

    /** 关键词，逗号分隔 */
    @Column(name = "keywords", length = 500)
    private String keywords;

    /** 总时长（秒） */
    @Column(name = "duration", nullable = false)
    private Integer duration = 0;

    /** 总集数 */
    @Column(name = "total_episodes", nullable = false)
    private Integer totalEpisodes = 0;

    /** 浏览次数 */
    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    /** 报名人数 */
    @Column(name = "enrollment_count", nullable = false)
    private Integer enrollmentCount = 0;

    /** 学习人数 */
    @Column(name = "student_count", nullable = false)
    private Integer studentCount = 0;

    /** 综合评分 */
    @Column(name = "score", nullable = false, precision = 3, scale = 2)
    private BigDecimal score = BigDecimal.ZERO;

    /** 状态：0=草稿 1=待审核 2=已上架 3=驳回 4=已下架 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = VideoStatus.DRAFT.getValue();

    /** 驳回原因 */
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** 排序权重 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 是否推荐 */
    @Column(name = "is_featured", nullable = false, columnDefinition = "tinyint")
    private Integer isFeatured = 0;

    /** 置顶优先级：0=不限 1=列表推荐 2=列表置顶 — 管理端操作下拉框直接控制 */
    @Column(name = "sticky_priority", nullable = false, columnDefinition = "tinyint")
    private Integer stickyPriority = 0;

    /** 上线时间 */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
}
