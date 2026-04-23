package com.taoke.admin.dto.cert;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 后台 — 工作认证审核列表项（按记录）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class AdminWorkCertVO {

    /** 工作经历记录 ID */
    private Integer id;

    private Integer trainerId;
    private Integer userId;
    private String phone;
    private String nickname;

    /** 单位名称 */
    private String companyName;

    /** 担任职务 */
    private String position;

    private LocalDate startDate;
    private LocalDate endDate;
    private String jobDescription;

    /** 证明文件 URL */
    private String proofFile;

    /** 状态：1=待审核 2=已通过 3=已驳回 */
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
