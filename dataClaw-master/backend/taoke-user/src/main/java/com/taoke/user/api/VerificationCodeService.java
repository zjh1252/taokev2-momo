package com.taoke.user.api;

/**
 * 验证码发送与校验能力（短信/邮件等渠道由实现层区分）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface VerificationCodeService {

    /**
     * 向目标发送验证码。
     *
     * @param target   接收目标（如手机号、邮箱）
     * @param type     业务类型（与存储/校验维度一致）
     * @param sendType 发送渠道或子类型
     * @param ip       请求方 IP（风控、限流等）
     */
    void sendCode(String target, String type, String sendType, String ip);

    /**
     * 校验验证码是否正确且未过期。
     *
     * @param target 接收目标
     * @param code   用户提交的验证码
     * @param type   业务类型
     */
    void verifyCode(String target, String code, String type);
}
