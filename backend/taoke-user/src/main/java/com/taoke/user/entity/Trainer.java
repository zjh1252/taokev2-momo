package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 专家扩展信息实体 — TRAINER 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_trainers")
public class Trainer extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    /** 头衔 */
    @Column(name = "title", length = 64)
    private String title;

    /** 个人简介（支持富文本） */
    @Column(name = "bio", columnDefinition = "text")
    private String bio;

    /** 擅长领域，JSON 数组 */
    @Column(name = "specialties", length = 512)
    private String specialties;

    /** 从业年限 */
    @Column(name = "experience_years")
    private Integer experienceYears;

    /** 最高学历 */
    @Column(name = "education", length = 64)
    private String education;

    /** 资质等级：0=普通，1=认证，2=高级认证 */
    @Column(name = "qualification_level", nullable = false, columnDefinition = "tinyint")
    private Integer qualificationLevel = 0;

    /** 主页配置 */
    @Column(name = "homepage_config", columnDefinition = "json")
    private String homepageConfig;

    /** 授课城市 ID 列表，JSON 数组 */
    @Column(name = "service_city_ids", length = 512)
    private String serviceCityIds;

    /** 联系偏好 */
    @Column(name = "contact_preference", length = 128)
    private String contactPreference;
}
