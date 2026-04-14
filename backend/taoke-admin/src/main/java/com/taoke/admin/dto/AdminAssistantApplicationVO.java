package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台助理申请列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Data
public class AdminAssistantApplicationVO {

    private Integer id;
    private Integer userId;
    private String phone;
    private String nickname;
    private String bio;
    private String authScope;
    private Integer status;
    private String rejectReason;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
}
