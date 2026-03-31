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

    /** 服务描述 */
    @Column(name = "bio", length = 512)
    private String bio;

    /** 授权范围说明 */
    @Column(name = "auth_scope", length = 512)
    private String authScope;
}
