package com.taoke.course.dto.pay;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 微信小程序 login code 换 openId 请求。
 *
 * @author Fangxinxin
 * @date 2026-06-25 14:00
 */
@Data
public class WechatOpenIdRequest {

    @NotBlank(message = "code 不能为空")
    private String code;
}
