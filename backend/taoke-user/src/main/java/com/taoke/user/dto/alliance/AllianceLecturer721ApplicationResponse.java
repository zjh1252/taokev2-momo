package com.taoke.user.dto.alliance;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 721 讲师合作申请响应。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Data
public class AllianceLecturer721ApplicationResponse {

    private Integer id;
    private Integer userId;
    private String applicationCode;
    private String lecturerName;
    private String idCardNo;
    private Integer coopYears;
    private BigDecimal dailyFee;
    private String address;
    private String phone;
    private String wechat;
    private String email;
    private String bankName;
    private String bankAccount;
    private String signatureUrl;
    private String agreementVersion;
    private Integer status;
    private String rejectReason;
    private LocalDateTime reviewedAt;
    private Integer reviewedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
