package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 专家助理扩展信息实体 — ASSISTANT 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_assistants")
public class Assistant extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    /** 真实姓名 */
    @Column(name = "real_name", length = 64)
    private String realName;

    /** 常用邮箱 */
    @Column(name = "email", length = 128)
    private String email;

    /** 服务描述（历史字段，新表单不再收集，但保留以兼容旧数据） */
    @Column(name = "bio", length = 512)
    private String bio;

    /** 授权范围说明（历史字段） */
    @Column(name = "auth_scope", length = 512)
    private String authScope;

    /**
     * 多服务城市结构化 JSON：{@code [{provinceId,cityId,provinceName,cityName}]}
     * <p>由 {@code com.taoke.user.dto.common.ServiceCityItem} 列表序列化产生。</p>
     */
    @Column(name = "service_cities", columnDefinition = "json")
    private String serviceCities;

    /** 注册助理合作协议签署时间 */
    @Column(name = "agreement_signed_at")
    private java.time.LocalDateTime agreementSignedAt;

    /** 协议版本号，默认 v1 */
    @Column(name = "agreement_version", length = 32)
    private String agreementVersion;
}
