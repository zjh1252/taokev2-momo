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
    private String realName;
    private String email;
    private String bio;
    private String authScope;
    /** 多服务城市结构化 JSON 字符串：{@code [{provinceId,cityId,provinceName,cityName}]} */
    private String serviceCities;
    private LocalDateTime agreementSignedAt;
    private String agreementVersion;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
