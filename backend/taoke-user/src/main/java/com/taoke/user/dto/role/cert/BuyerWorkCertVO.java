package com.taoke.user.dto.role.cert;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 企业采购方工作认证记录 — C 端 / 后台共用 VO。
 *
 * @author Fangxinxin
 * @date 2026-06-27 14:00
 */
@Data
public class BuyerWorkCertVO {

    private Integer id;
    private String companyName;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
    private String jobDescription;
    private String proofFile;
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
    private Integer sortOrder;
}
