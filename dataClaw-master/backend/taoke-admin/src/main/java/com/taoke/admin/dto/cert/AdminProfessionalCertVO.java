package com.taoke.admin.dto.cert;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 后台 — 专业认证审核列表项。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class AdminProfessionalCertVO {

    private Integer trainerId;
    private Integer userId;
    private String phone;
    private String nickname;
    private String realName;

    /** 专业认证附件 URL 列表 */
    private List<String> files;

    /** 状态：1=待审核 2=已通过 3=已驳回 */
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
