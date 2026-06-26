package com.taoke.course.dto.video;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;

/**
 * 管理后台创建录播课请求体
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AdminSaveVideoRequest extends SaveVideoRequest {

    /** 发布模式：PENDING=待审核 PUBLISHED=直接上架 */
    @NotBlank(message = "发布模式不能为空")
    private String publishMode;

    /** 发布主体：TRAINER / INSTITUTION */
    @NotBlank(message = "发布主体不能为空")
    private String publisherSubject;

    /** 发布者用户 ID */
    private Integer publisherUserId;

    /** 关联专家 ID（机构发布时可选） */
    private Integer trainerId;

    /** 关联机构 ID（专家发布时可选，用于展示） */
    private Integer institutionId;

    /** 课程总时长（分钟），无章节时可写入主表 duration */
    private Integer durationMinutes;

    /** 企业采购封顶价 */
    private BigDecimal companyPrice;

    /** 单次最多购买人数 */
    private Integer maxPurchaseQty;

    /** 章节列表（SERIES 类型批量创建） */
    @Valid
    private List<SaveVideoChapterRequest> chapters;
}
