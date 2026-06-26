package com.taoke.admin.dto.cert;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 后台 — 学历认证审核列表项（按记录）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class AdminEducationCertVO {

    /** 学历记录 ID */
    private Integer id;

    /** 专家主键 */
    private Integer trainerId;

    /** 专家所属用户 ID */
    private Integer userId;

    private String phone;
    private String nickname;

    /** 持证人姓名 */
    private String holderName;

    /** 院校名称 */
    private String schoolName;

    /** 所学专业 */
    private String major;

    /** 学历 */
    private String degree;

    private LocalDate startDate;
    private LocalDate endDate;
    private Integer isGraduated;

    /** 证明文件 URL */
    private String proofFile;

    /** 状态：1=待审核 2=已通过 3=已驳回 */
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
