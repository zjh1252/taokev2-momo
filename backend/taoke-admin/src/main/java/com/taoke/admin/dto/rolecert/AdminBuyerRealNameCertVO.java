package com.taoke.admin.dto.rolecert;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台 — 企业采购方实名认证审核列表项。
 *
 * @author Fangxinxin
 * @date 2026-06-27 14:00
 */
@Data
public class AdminBuyerRealNameCertVO {

    private Integer buyerId;
    private Integer userId;
    private String phone;
    private String nickname;
    private String companyName;
    private String realName;
    private String idCardNo;
    private String idCardFront;
    private String idCardBack;
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
