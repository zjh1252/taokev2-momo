package com.taoke.user.dto.role.cert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 专家经纪公司资质认证提交请求（公司Logo + 营业执照单条整体审核）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class EnterpriseAgentCertRequest {

    @NotBlank(message = "请上传公司 Logo")
    @Size(max = 512, message = "公司 Logo URL 不超过512个字符")
    private String certLogoUrl;

    @NotBlank(message = "请上传营业执照")
    @Size(max = 512, message = "营业执照 URL 不超过512个字符")
    private String qualificationDocUrl;
}
