package com.taoke.user.dto.enterprisebuyer;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存企业培训采购方信息请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class EnterpriseBuyerRequest {

    @Size(max = 128, message = "企业名称不超过128个字符")
    private String companyName;

    @Size(max = 64, message = "行业不超过64个字符")
    private String industry;

    @Size(max = 32, message = "企业规模不超过32个字符")
    private String companySize;

    @Size(max = 64, message = "联系人姓名不超过64个字符")
    private String contactName;

    @Size(max = 20, message = "联系电话不超过20个字符")
    private String contactPhone;

    @Size(max = 10, message = "邮编不超过10个字符")
    private String postCode;

    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;

    @Size(max = 200, message = "详细地址不超过200个字符")
    private String address;

    /** 培训需求标签，JSON 数组字符串 */
    @Size(max = 512, message = "培训需求标签不超过512个字符")
    private String trainingTags;
}
