package com.taoke.user.dto.role.cert;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 培训机构「公司资料」提交请求（整体提交、整体审核）。
 *
 * <p>注册地址直接复用机构地址 5 段（postCode / provinceId / cityId /
 * districtId / townId / address），与申请阶段共用同一组列。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class InstitutionCompanyInfoRequest {

    @NotBlank(message = "请上传公司 Logo")
    @Size(max = 512, message = "公司 Logo URL 不超过512个字符")
    private String logoUrl;

    @NotBlank(message = "公司性质不能为空")
    @Size(max = 32, message = "公司性质不超过32个字符")
    private String companyNature;

    @Size(max = 255, message = "公司网址不超过255个字符")
    private String website;

    @NotBlank(message = "机构规模不能为空")
    @Size(max = 32, message = "机构规模不超过32个字符")
    private String companySize;

    @NotBlank(message = "年营业额不能为空")
    @Size(max = 64, message = "年营业额不超过64个字符")
    private String annualRevenue;

    @NotBlank(message = "注册资本不能为空")
    @Size(max = 64, message = "注册资本不超过64个字符")
    private String registeredCapital;

    // ============ 注册地址（复用机构地址 5 段） ============

    @NotNull(message = "请选择省份")
    private Integer provinceId;

    @NotNull(message = "请选择城市")
    private Integer cityId;

    @NotNull(message = "请选择区县")
    private Integer districtId;

    private Integer townId;

    @NotBlank(message = "详细地址不能为空")
    @Size(max = 200, message = "详细地址不超过200个字符")
    private String address;

    @Size(max = 10, message = "邮编不超过10个字符")
    private String postCode;

    // ============ 业务信息 ============

    @NotNull(message = "公开课最高佣金比例不能为空")
    @DecimalMin(value = "0", message = "佣金比例不能小于 0")
    @DecimalMax(value = "100", message = "佣金比例不能大于 100")
    private BigDecimal maxCommissionRate;

    /** 可接受付款方式（如：对公转账 / 支付宝 / 微信 / 现金） */
    private List<String> paymentMethods;

    /** 是否有版权课：0=否 1=是 */
    private Integer hasCopyrightCourse;

    @Size(max = 64, message = "银行卡号不超过64个字符")
    private String bankCardNo;

    @Size(max = 128, message = "开户行不超过128个字符")
    private String bankName;

    @Size(max = 128, message = "开户行支行不超过128个字符")
    private String bankBranch;

    @NotBlank(message = "请上传营业执照附件")
    @Size(max = 512, message = "营业执照 URL 不超过512个字符")
    private String licenseDocUrl;

    /** 营业执照号（沿用 license_no 列） */
    @Pattern(regexp = "^\\d{15}$|^[A-Z\\d]{18}$", message = "营业执照号需为15位纯数字或18位大写统一社会信用代码")
    @Size(max = 64, message = "营业执照号不超过64个字符")
    private String licenseNo;
}
