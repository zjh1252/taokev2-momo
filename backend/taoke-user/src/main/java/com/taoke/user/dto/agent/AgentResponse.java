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
    private String realName;
    private String email;
    private String bio;
    private String specialties;
    /** 历史字段：服务城市 ID 列表 JSON 字符串 */
    private String serviceCityIds;
    /** 多服务城市结构化 JSON 字符串：{@code [{provinceId,cityId,provinceName,cityName}]} */
    private String serviceCities;
    private LocalDateTime agreementSignedAt;
    private String agreementVersion;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
