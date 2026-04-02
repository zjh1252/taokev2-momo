package com.taoke.user.dto.trainer;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 保存/更新专家档案请求（主表字段，子表通过独立端点保存）
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class TrainerRequest {

    // ==================== 基础信息 ====================

    @Size(max = 100, message = "姓名不超过100个字符")
    private String name;

    @Size(max = 500, message = "头像 URL 不超过500个字符")
    private String avatar;

    @Size(max = 64, message = "头衔不超过64个字符")
    private String title;

    /** 性别：0=未知，1=男，2=女 */
    private Integer gender;

    @Size(max = 20, message = "联系电话不超过20个字符")
    private String phone;

    @Size(max = 200, message = "邮箱不超过200个字符")
    private String email;

    @Size(max = 10, message = "邮编不超过10个字符")
    private String postCode;

    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;

    @Size(max = 200, message = "详细地址不超过200个字符")
    private String address;

    // ==================== 专业信息 ====================

    /** 个人简介（支持富文本） */
    private String bio;

    /** 详细介绍（富文本） */
    private String intro;

    /** 从业经历/背景 */
    private String background;

    /** 专长描述 */
    private String goodAt;

    /** 擅长领域，JSON 数组字符串 */
    @Size(max = 512, message = "擅长领域不超过512个字符")
    private String specialties;

    /** 讲师自选/新增标签，逗号分隔 */
    @Size(max = 500, message = "标签不超过500个字符")
    private String expertiseTags;

    /** 授课风格 */
    @Size(max = 500, message = "授课风格不超过500个字符")
    private String teachingStyle;

    /** 从业年限 */
    private Integer experienceYears;

    /** 培训年限 */
    private Integer teachingYears;

    /** 授课城市 ID 列表，JSON 数组字符串 */
    @Size(max = 512, message = "授课城市列表不超过512个字符")
    private String serviceCityIds;

    // ==================== 报价信息 ====================

    private BigDecimal quoteMin;
    private BigDecimal quoteMax;

    @Size(max = 20, message = "报价单位不超过20个字符")
    private String quoteUnit;

    @Size(max = 500, message = "报价备注不超过500个字符")
    private String quoteRemark;

    // ==================== 平台展示 ====================

    @Size(max = 500, message = "背景图 URL 不超过500个字符")
    private String backgroundImage;
}
