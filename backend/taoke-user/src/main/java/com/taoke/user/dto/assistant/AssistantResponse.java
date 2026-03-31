package com.taoke.user.dto.assistant;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 专家助理档案返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class AssistantResponse {

    private Integer id;
    private String bio;
    private String authScope;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
