package com.taoke.user.dto.trainer;

import com.taoke.user.dto.trainerbook.SaveTrainerBookRequest;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 保存/更新专家档案请求（主表字段，子表通过独立端点保存）
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class TrainerRequest {

    // ==================== 基础信息 ====================

    @Size(max = 100, message = "真实姓名不超过100个字符")
    private String name;

    /** 授课姓名 */
    @Size(max = 64, message = "授课姓名不超过64个字符")
    private String teachingName;

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

    /**
     * 身份证号（18 位）。
     * <p>专家入驻为实名认证场景，最少在入驻阶段记录该字段；后续 RealName 认证可上传证件照辅助核验。</p>
     */
    @Pattern(
            regexp = "^$|^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$",
            message = "身份证号格式不正确"
    )
    @Size(max = 32, message = "身份证号不超过32个字符")
    private String idCardNo;

    // ==================== 专业信息 ====================

    /** 个人简介（支持富文本） */
    private String bio;

    /** 一句话介绍（80 字内） */
    @Size(max = 255, message = "一句话介绍不超过255个字符")
    private String oneLineIntro;

    /** 详细介绍（富文本） */
    private String intro;

    /** 从业经历/背景 */
    private String background;

    /** 部分客户（长文本） */
    private String partialClients;

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

    /** 淘课网售价（元/天） */
    private BigDecimal taokePrice;

    /** 淘课网合作课酬（元/天） */
    private BigDecimal taokeCommission;

    // ==================== 协议与简历 ====================

    /** 是否勾选《淘课网注册专家合作协议》 */
    private Boolean agreementSigned;

    /** 协议版本号，前端默认传 v1 */
    @Size(max = 32, message = "协议版本号不超过32个字符")
    private String agreementVersion;

    /** 最近一次上传简历的 URL */
    @Size(max = 512, message = "简历 URL 不超过512个字符")
    private String resumeUrl;

    // ==================== 平台展示 ====================

    @Size(max = 500, message = "背景图 URL 不超过500个字符")
    private String backgroundImage;

    // ==================== 多选关联（apply 时一次性提交，避免分步调用受 RequireRole 拦截） ====================

    /** 擅长行业一级分类 ID 列表 */
    private List<Integer> industryCategoryIds;

    /** 擅长领域一级分类 ID 列表 */
    private List<Integer> expertiseCategoryIds;

    /** 我的著作（一次性整体替换式保存） */
    private List<SaveTrainerBookRequest> books;

    /** 荣誉与资质文件（图片/PDF，多文件，一次性整体替换式保存） */
    private List<TrainerHonorFileItem> honorFiles;
}
