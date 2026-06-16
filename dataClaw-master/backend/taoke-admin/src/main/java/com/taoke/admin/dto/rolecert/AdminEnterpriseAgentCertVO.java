package com.taoke.admin.dto.rolecert;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台 — 经纪公司资质认证审核列表项。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class AdminEnterpriseAgentCertVO {

    /** user_enterprise_agents.id */
    private Integer enterpriseAgentId;

    private Integer userId;
    private String phone;
    private String nickname;

    /** 公司名称 */
    private String companyName;

    /** 公司 Logo URL */
    private String certLogoUrl;

    /** 营业执照 URL */
    private String qualificationDocUrl;

    /** 1=待审核 2=已通过 3=已驳回 */
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
