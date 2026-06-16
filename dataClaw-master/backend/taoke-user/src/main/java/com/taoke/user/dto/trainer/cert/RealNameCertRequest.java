package com.taoke.user.dto.trainer.cert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 实名认证提交请求。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class RealNameCertRequest {

    @NotBlank(message = "真实姓名不能为空")
    @Size(max = 64, message = "真实姓名不超过64个字符")
    private String realName;

    @NotBlank(message = "身份证号不能为空")
    @Pattern(regexp = "^\\d{15}$|^\\d{17}[\\dXx]$", message = "身份证号格式不正确")
    private String idCardNo;

    @NotBlank(message = "请上传身份证人像面")
    @Size(max = 500, message = "身份证人像面 URL 不超过500个字符")
    private String idCardFront;

    @NotBlank(message = "请上传身份证国徽面")
    @Size(max = 500, message = "身份证国徽面 URL 不超过500个字符")
    private String idCardBack;
}
