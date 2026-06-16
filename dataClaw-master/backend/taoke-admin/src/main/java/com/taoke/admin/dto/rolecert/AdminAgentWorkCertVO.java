package com.taoke.admin.dto.rolecert;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 后台 — 经纪人工作认证审核列表项（按记录）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class AdminAgentWorkCertVO {

    /** 经纪人工作经历记录 ID */
    private Integer id;

    private Integer agentId;
    private Integer userId;
    private String phone;
    private String nickname;
    private String realName;

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
}
