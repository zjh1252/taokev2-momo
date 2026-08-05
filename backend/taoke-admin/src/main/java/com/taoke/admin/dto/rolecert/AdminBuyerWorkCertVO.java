package com.taoke.admin.dto.rolecert;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 后台 — 企业采购方工作认证审核列表项（按记录）。
 *
 * @author Fangxinxin
 * @date 2026-06-27 14:00
 */
@Data
public class AdminBuyerWorkCertVO {

    private Integer id;
    private Integer buyerId;
    private Integer userId;
    private String phone;
    private String nickname;
    private String companyName;
    private String contactName;
    private String workCompanyName;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
    private String jobDescription;
    private String proofFile;
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
