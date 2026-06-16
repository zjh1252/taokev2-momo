package com.taoke.user.dto.role.cert;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 经纪人工作认证记录 — C 端 / 后台共用 VO。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class AgentWorkCertVO {

    private Integer id;

    private String companyName;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
    private String jobDescription;
    private String proofFile;

    /** 1=待审核 2=已通过 3=已驳回 */
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;

    private Integer sortOrder;
}
