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
 *   <li>200xx   — 专家/经纪人/机构（供给方）</li>
 *   <li>300xx   — 课程</li>
 *   <li>400xx   — 订单/支付</li>
 *   <li>500xx   — 评价/互动</li>
 *   <li>600xx   — 内容/CMS</li>
 *   <li>800xx   — 搜索/ES</li>
 *   <li>900xx   — 通用/系统级</li>
 * </ul>
 * 各业务模块在开发时按需在此枚举中追加错误码。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
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
    CAPTCHA_RATE_LIMIT(429, 10008, "验证码发送过于频繁，请稍后再试"),
    PHONE_ALREADY_BOUND(400, 10009, "该手机号已被其他账号绑定"),
    ROLE_NOT_MATCH(403, 10010, "当前角色无此操作权限"),
    OLD_PASSWORD_INCORRECT(400, 10011, "旧密码不正确"),
    PASSWORD_NOT_SET(400, 10012, "尚未设置密码，请使用验证码登录"),
    ROLE_APPLICATION_PENDING(400, 10013, "已有进行中的申请，请等待审核"),
    ROLE_ALREADY_ACTIVE(400, 10014, "已拥有该角色"),
    ROLE_DISABLED(403, 10015, "角色已被禁用，请联系管理员"),
    USERNAME_TAKEN(400, 10016, "该账号已被占用"),
    USERNAME_INVALID(400, 10017, "账号格式不正确（4-32 位字母/数字/下划线）"),
    UCENTER_UNAVAILABLE(503, 10018, "账号服务暂不可用，请稍后再试"),
    UCENTER_REGISTER_FAILED(400, 10019, "注册失败，请稍后再试"),
    SMS_SEND_FAILED(503, 10020, "短信发送失败，请稍后再试"),
    CAPTCHA_REQUIRED(400, 10021, "请先完成滑块验证"),
    ACCOUNT_LOGIN_LOCKED(403, 10022, "密码错误次数过多，账号已锁定，请稍后再试"),

    /* ==================== 权限 101xx ==================== */
    UNAUTHORIZED(401, 10101, "请先登录"),
    FORBIDDEN(403, 10102, "无权限访问"),
    TOKEN_EXPIRED(401, 10103, "登录已过期，请重新登录"),

    /* ==================== 专家案例/精彩瞬间 200xx ==================== */
    TRAINER_CASE_NOT_FOUND(404, 20030, "案例不存在"),
    TRAINER_CASE_NO_PERMISSION(403, 20031, "无权操作此案例"),
    TRAINER_CASE_STATUS_INVALID(400, 20032, "案例当前状态不允许此操作"),
    TRAINER_CASE_FILE_NOT_FOUND(404, 20033, "案例文件不存在"),
    TRAINER_HIGHLIGHT_NOT_FOUND(404, 20050, "精彩瞬间不存在"),
    TRAINER_HIGHLIGHT_NO_PERMISSION(403, 20051, "无权操作此精彩瞬间"),
    TRAINER_HIGHLIGHT_STATUS_INVALID(400, 20052, "精彩瞬间当前状态不允许此操作"),
    TRAINER_PROFILE_REQUIRED(400, 20060, "请先完成专家入驻"),

    /* ==================== 课程 300xx ==================== */
    COURSE_NOT_FOUND(404, 30001, "课程不存在"),
    COURSE_STATUS_INVALID(400, 30002, "课程当前状态不允许此操作"),
    COURSE_NO_PERMISSION(403, 30003, "无权操作此课程"),
    COURSE_PLAN_REQUIRED(400, 30004, "公开课必须添加至少一条开课计划"),

    /* ==================== 订单/支付 400xx ==================== */
    CART_ITEM_EXISTS(400, 40001, "该商品已在购物车中"),
    CART_ITEM_NOT_FOUND(404, 40002, "购物车条目不存在"),
    PRODUCT_NOT_FOUND(404, 40003, "商品不存在或已下架"),
    PRODUCT_NOT_PURCHASABLE(400, 40004, "该商品为免费课程，无需购买"),
    ORDER_NOT_FOUND(404, 40005, "订单不存在"),
    ORDER_STATUS_INVALID(400, 40006, "当前订单状态不允许此操作"),
    ORDER_EXPIRED(400, 40007, "订单已过期"),
    PAYMENT_ORDER_MISMATCH(400, 40008, "支付信息与订单不匹配"),
    ALREADY_ENROLLED(400, 40009, "您已报名该课程"),
    ORDER_ITEMS_EMPTY(400, 40010, "订单商品不能为空"),
    CANNOT_BUY_OWN_PRODUCT(400, 40011, "不能购买自己发布的课程"),
    INVOICE_ALREADY_REQUESTED(400, 40012, "该订单已申请过发票"),
    INVOICE_ORDER_NOT_PAID(400, 40013, "仅已支付订单可申请发票"),

    /* ==================== 评价/互动 500xx ==================== */
    FAVORITE_ALREADY_EXISTS(400, 50001, "已收藏，请勿重复操作"),
    FAVORITE_NOT_FOUND(404, 50002, "未收藏该资源"),
    LIKE_ALREADY_EXISTS(400, 50003, "已点赞，请勿重复操作"),
    LIKE_NOT_FOUND(404, 50004, "未点赞该资源"),
    REVIEW_TARGET_INVALID(400, 50005, "评价目标不存在或不可评价"),
    REVIEW_NOT_FOUND(404, 50006, "评价不存在"),
    REVIEW_COMMENT_TOO_SHORT(400, 50007, "文字评价不能少于20字"),
    REVIEW_RATING_INVALID(400, 50008, "评分必须在 1~5 之间"),
    TRAINER_NOT_FOUND_FOR_MSG(404, 50009, "目标专家不存在"),
    INTERACTION_TARGET_NOT_FOUND(404, 50010, "目标资源不存在"),

    /* ==================== 需求 700xx ==================== */
    DEMAND_NOT_FOUND(404, 70001, "需求不存在"),
    DEMAND_NO_PERMISSION(403, 70002, "无权操作此需求"),
    DEMAND_STATUS_INVALID(400, 70003, "需求当前状态不允许此操作"),
    DEMAND_ENTERPRISE_REQUIRED(400, 70004, "请先申请企业采购者角色"),

    /* ==================== 搜索/ES 800xx ==================== */
    SEARCH_INDEX_ERROR(503, 80001, "索引操作失败"),
    SEARCH_DOCUMENT_ERROR(503, 80002, "文档写入/删除失败"),
    SEARCH_EXECUTE_ERROR(503, 80003, "搜索执行失败"),
    SEARCH_FORBIDDEN(403, 80004, "搜索操作被禁止"),

    /* ==================== 通用/系统级 900xx ==================== */
    PARAM_INVALID(400, 90001, "参数校验失败"),
    NOT_FOUND(404, 90002, "资源不存在"),
    DUPLICATE_REQUEST(409, 90003, "重复请求"),

    /* ==================== 文件上传 900xx ==================== */
    FILE_UPLOAD_FAILED(500, 90010, "文件上传失败"),
    INVALID_FILE_TYPE(400, 90011, "不支持的文件类型"),
    FILE_TOO_LARGE(400, 90012, "文件大小超出限制"),

    /* ==================== 敏感词 900xx ==================== */
    SENSITIVE_WORD_NOT_FOUND(404, 90020, "敏感词不存在"),
    SENSITIVE_WORD_EXISTS(400, 90021, "敏感词已存在"),
    SENSITIVE_WORD_IMPORT_EMPTY(400, 90022, "导入文件内容为空"),

    /* ==================== 内容审查 ==================== */
    CONTENT_CHECK_FAILED(422, 100422, "内容审查未通过"),

    /* ==================== AI 能力 900xx ==================== */
    AI_NOT_ENABLED(503, 90030, "AI 解析能力未启用，请联系管理员配置"),
    AI_CALL_FAILED(503, 90031, "AI 服务调用失败，请稍后重试"),
    AI_PARSE_FAILED(500, 90032, "AI 返回内容解析失败"),

    INTERNAL_ERROR(500, 99999, "系统繁忙，请稍后再试");

    /** HTTP 状态码（控制 ResponseEntity 的 status） */
    private final int httpStatus;

    /** 业务状态码（放在响应 body 的 code 字段） */
    private final int code;

    /** 默认提示信息 */
    private final String message;

}
