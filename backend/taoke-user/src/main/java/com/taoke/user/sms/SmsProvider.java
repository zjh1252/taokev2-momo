package com.taoke.user.sms;

/**
 * 短信发送抽象接口
 * <p>
 * 通过 {@code taoke.sms.provider} 配置项切换具体实现（mock / aliyun / tencent）。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
public interface SmsProvider {

    /**
     * 发送短信验证码
     *
     * @param phone 目标手机号
     * @param code  验证码
     */
    void send(String phone, String code);
}
