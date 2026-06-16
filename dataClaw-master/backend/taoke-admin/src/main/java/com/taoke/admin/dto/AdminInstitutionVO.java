package com.taoke.admin.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 后台机构列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-09 10:00
 */
@Data
public class AdminInstitutionVO {

    private Integer id;
    private Integer userId;
    private String orgName;

    /** 机构类型：0=非高校，1=高校 */
    private Integer orgType;

    /** 状态：0=待审核，1=已发布，2=已下线 */
    private Integer status;

    /** 综合评分 */
    private BigDecimal score;

    /** 是否已认证 */
    private Integer isCertified;

    /** 是否金牌推荐 */
    private Integer isRecommended;

    /** 是否培训协会 */
    private Boolean association;

    /** 浏览量 */
    private Integer viewCount;

    /** 联系人姓名 */
    private String contactName;

    /** 联系电话 */
    private String contactPhone;

    private LocalDateTime createdAt;
}
