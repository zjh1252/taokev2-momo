package com.taoke.user.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 变更手机号请求（两步验证）
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class ChangePhoneRequest {

    /** 旧手机收到的验证码 */
    @NotBlank(message = "旧手机验证码不能为空")
    private String oldPhoneCode;

    /** 新手机号 */
    @NotBlank(message = "新手机号不能为空")
    private String newPhone;

    /** 新手机收到的验证码 */
    @NotBlank(message = "新手机验证码不能为空")
    private String newPhoneCode;
}
