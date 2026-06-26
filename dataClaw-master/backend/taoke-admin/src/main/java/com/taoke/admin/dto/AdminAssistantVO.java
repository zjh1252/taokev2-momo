package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台助理列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Data
public class AdminAssistantVO {

    private Integer id;
    private Integer userId;
    private String bio;
    private String authScope;
    private LocalDateTime createdAt;
}
