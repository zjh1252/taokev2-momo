package com.taoke.course.dto.pay;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 发起支付请求体
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Data
public class PayRequest {

    /** 订单编号 */
    @NotBlank(message = "订单编号不能为空")
    private String orderNo;

    /** 支付方式：MOCK / ALIPAY / WECHAT，默认 MOCK */
    private String method = "MOCK";

    /** 客户端类型：PC / H5 / MINI_PROGRAM / APP，默认 PC */
    private String clientType = "PC";

    /** 微信 JSAPI 所需 openId（小程序 login code 换取后传入） */
    private String openId;
}
