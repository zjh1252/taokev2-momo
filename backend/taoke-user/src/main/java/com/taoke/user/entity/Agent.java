package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 专家经纪人扩展信息实体 — AGENT 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_agents")
public class Agent extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    /** 服务介绍 */
    @Column(name = "bio", columnDefinition = "text")
    private String bio;

    /** 擅长领域，JSON 数组 */
    @Column(name = "specialties", length = 512)
    private String specialties;

    /** 服务城市 ID 列表，JSON 数组 */
    @Column(name = "service_city_ids", length = 512)
    private String serviceCityIds;
}
