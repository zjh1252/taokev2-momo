package com.taoke.admin.dto.cert;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台 — 实名认证审核列表项。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class AdminRealNameCertVO {

    /** 专家主键 */
    private Integer trainerId;

    /** 专家所属用户 ID */
    private Integer userId;

    /** 用户手机号 */
    private String phone;

    /** 用户昵称 */
    private String nickname;

    /** 真实姓名（来自 trainer.name 或 sys_users.real_name） */
    private String realName;

    /** 身份证号 */
    private String idCardNo;

    /** 身份证人像面 URL */
    private String idCardFront;

    /** 身份证国徽面 URL */
    private String idCardBack;

    /** 状态：1=待审核 2=已通过 3=已驳回 */
    private Integer status;

    /** 驳回原因 */
    private String rejectReason;

    /** 提交时间 */
    private LocalDateTime submittedAt;

    /** 审核时间 */
    private LocalDateTime auditedAt;
}
