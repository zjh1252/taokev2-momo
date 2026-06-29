package com.taoke.course.dto.video;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 创建/编辑录播课请求体
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Data
public class SaveVideoRequest {

    @NotBlank(message = "录播课标题不能为空")
    private String title;

    /** 是否保存为草稿：true=存草稿（仅校验标题），false/null=提交审核 */
    private Boolean draft;

    /** 视频类型：SERIES / SINGLE / EXTERNAL */
    private String videoType;

    /** 一级分类ID */
    private Integer categoryId;

    /** 二级分类ID */
    private Integer subCategoryId;

    /** 封面图URL */
    private String coverUrl;

    /** 课程介绍（富文本HTML）；提交审核时必填，存草稿时可空（服务层校验） */
    private String intro;

    /** 视频地址（SINGLE类型时使用） */
    private String videoUrl;

    /** 外部链接（EXTERNAL类型时使用） */
    private String externalUrl;

    /** 授课老师 */
    private String teacherName;

    /** 关联讲师ID */
    private Integer trainerId;

    /** 课程价格 */
    private BigDecimal price;

    /** 原价 */
    private BigDecimal originalPrice;

    /** 是否免费 */
    private Integer isFree;

    /** 关键词 */
    private String keywords;

    /** 企业采购封顶价（元）；0 或不设置表示不限 */
    private BigDecimal companyPrice;

    /** 单次最多购买人数；与封顶价配合使用 */
    private Integer maxPurchaseQty;
}
