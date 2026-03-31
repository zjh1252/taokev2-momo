package com.taoke.user.dto.user;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 角色入驻申请状态返回 — 6 个供给方角色共用。
 *
 * @author Fangxinxin
 * @date 2026-03-31
 */
@Data
public class RoleApplicationStatusResponse {

    /** 角色编码 */
    private String role;

    /** 角色中文名 */
    private String roleName;

    /** 状态码：1=生效，2=待审核，3=已驳回，4=已禁用 */
    private Integer status;

    /** 状态文本 */
    private String statusText;

    /** 驳回原因（status=3 时有值） */
    private String rejectReason;

    /** 申请时间 */
    private LocalDateTime appliedAt;

    /** 审核通过时间 */
    private LocalDateTime approvedAt;
}
