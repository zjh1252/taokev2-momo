package com.taoke.user.dto.alliance;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 推广大使申请响应。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Data
public class AllianceAmbassadorApplicationResponse {

    private Integer id;
    private Integer userId;
    private String ambassadorCode;
    private String agreementVersion;
    private Integer status;
    private String rejectReason;
    private LocalDateTime reviewedAt;
    private Integer reviewedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
