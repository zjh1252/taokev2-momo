package com.taoke.course.dto.video;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 录播课详情（含系列、章节、分类名、发布者信息）
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Data
public class VideoDetailVO {

    private Integer id;
    private String title;
    private String videoType;
    private String videoTypeLabel;

    private Integer publisherId;
    private String publisherType;
    private String publisherName;

    private Integer categoryId;
    private String categoryName;
    private Integer subCategoryId;
    private String subCategoryName;

    private String coverUrl;
    private String intro;
    private String videoUrl;
    private String externalUrl;

    private String teacherName;
    private Integer trainerId;
    private String trainerName;
    /** 专家头像（仅 trainerId 有效时有值） */
    private String trainerAvatar;

    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer isFree;
    private String keywords;

    /** 企业采购封顶价 */
    private BigDecimal companyPrice;
    /** 单次最多购买人数 */
    private Integer maxPurchaseQty;

    private Integer duration;
    private Integer totalEpisodes;

    private Integer isFeatured;
    private Integer status;
    private String statusLabel;
    private String rejectReason;

    private Integer sortOrder;
    private Integer viewCount;
    private Integer enrollmentCount;
    private Integer studentCount;
    private BigDecimal score;
    /** 收藏人数 */
    private Long favoriteCount;

    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 系列列表（含各系列下的章节） */
    private List<VideoSeriesVO> seriesList;

    /** 不属于任何系列的独立章节 */
    private List<VideoChapterVO> standaloneChapters;

    /** 是否属于视频包系列（展示「系列介绍」Tab） */
    private Boolean hasSeriesPackage;
}
