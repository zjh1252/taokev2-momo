package com.taoke.user.dto.agent;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 专家经纪人档案返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class AgentResponse {

    private Integer id;
    private String bio;
    private String specialties;
    private String serviceCityIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
