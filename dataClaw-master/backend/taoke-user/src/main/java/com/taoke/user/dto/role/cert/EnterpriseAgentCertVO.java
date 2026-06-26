package com.taoke.user.dto.role.cert;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 专家经纪公司资质认证 — 查询返回。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class EnterpriseAgentCertVO {

    /** 公司 Logo URL */
    private String certLogoUrl;

    /** 营业执照附件 URL（沿用 qualification_doc_url） */
    private String qualificationDocUrl;

    /** NULL=未提交 1=待审核 2=已通过 3=已驳回 */
    private Integer status;

    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
