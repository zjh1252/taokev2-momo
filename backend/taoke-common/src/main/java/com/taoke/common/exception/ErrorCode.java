package com.taoke.common.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 全局业务错误码枚举
 * <p>
 * 编码规则：5 位数字，前两位为模块编号，后三位为错误序号。
 * <ul>
 *   <li>0       — 成功</li>
 *   <li>100xx   — 用户/认证</li>
 *   <li>101xx   — 权限</li>
 *   <li>200xx   — 讲师/经纪人/机构（供给方）</li>
 *   <li>300xx   — 课程</li>
 *   <li>400xx   — 订单/支付</li>
 *   <li>500xx   — 评价/互动</li>
 *   <li>600xx   — 内容/CMS</li>
 *   <li>900xx   — 通用/系统级</li>
 * </ul>
 * 各业务模块在开发时按需在此枚举中追加错误码。
 */
@Getter
@AllArgsConstructor
public enum ErrorCode {

    /* ==================== 成功 ==================== */
    SUCCESS(200, 0, "success"),

    /* ==================== 用户/认证 100xx ==================== */
    INVALID_PHONE(400, 10001, "手机号格式不正确"),
    CAPTCHA_EXPIRED(400, 10002, "验证码已过期"),
    CAPTCHA_INCORRECT(400, 10003, "验证码不正确"),
    ACCOUNT_EXISTS(400, 10004, "该账号已注册"),
    ACCOUNT_NOT_FOUND(404, 10005, "账号不存在"),
    PASSWORD_INCORRECT(400, 10006, "密码不正确"),
    ACCOUNT_FROZEN(403, 10007, "账号已被冻结"),

    /* ==================== 权限 101xx ==================== */
    UNAUTHORIZED(401, 10101, "请先登录"),
    FORBIDDEN(403, 10102, "无权限访问"),
    TOKEN_EXPIRED(401, 10103, "登录已过期，请重新登录"),

    /* ==================== 通用/系统级 900xx ==================== */
    PARAM_INVALID(400, 90001, "参数校验失败"),
    NOT_FOUND(404, 90002, "资源不存在"),
    DUPLICATE_REQUEST(409, 90003, "重复请求"),
    INTERNAL_ERROR(500, 99999, "系统繁忙，请稍后再试");

    /** HTTP 状态码（控制 ResponseEntity 的 status） */
    private final int httpStatus;

    /** 业务状态码（放在响应 body 的 code 字段） */
    private final int code;

    /** 默认提示信息 */
    private final String message;

}
