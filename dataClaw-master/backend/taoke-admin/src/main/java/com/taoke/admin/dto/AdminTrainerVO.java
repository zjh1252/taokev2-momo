package com.taoke.admin.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 后台专家列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-02 10:00
 */
@Data
public class AdminTrainerVO {

    private Integer id;
    private Integer userId;
    private String name;
    private String avatar;
    private String title;
    private String phone;

    /** 专家表状态：0=草稿，1=待审核，2=审核通过，3=审核驳回，4=已禁用 */
    private Integer status;

    /** 综合评分 */
    private BigDecimal score;

    /** 认证等级 */
    private Integer certLevel;

    /** 是否签约 */
    private Integer isSigned;

    /** 是否推荐 */
    private Integer isRecommended;

    /** 曝光量 */
    private Integer viewCount;

    /** 审核通过时间 */
    private LocalDateTime approvedAt;

    private LocalDateTime createdAt;
}
