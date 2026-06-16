package com.taoke.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 发送验证码请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class SendCodeRequest {

    /** 目标手机号或邮箱 */
    @NotBlank(message = "发送目标不能为空")
    private String target;

    /** 用途：REGISTER / LOGIN / RESET_PASSWORD / CHANGE_PHONE / CHANGE_EMAIL */
    @NotBlank(message = "验证码用途不能为空")
    private String type;

    /** 发送渠道：SMS / EMAIL，默认 SMS */
    private String sendType = "SMS";
}
