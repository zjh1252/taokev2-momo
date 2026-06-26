package com.taoke.user.dto.trainer.cert;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 实名认证查询返回。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class RealNameCertResponse {

    /** 真实姓名（写入 sys_users.real_name） */
    private String realName;

    private String idCardNo;
    private String idCardFront;
    private String idCardBack;

    /** NULL=未提交 1=待审核 2=已通过 3=已驳回 */
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
