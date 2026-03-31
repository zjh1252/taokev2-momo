package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 个人学员扩展信息实体 — BUYER 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "sys_buyer_profiles")
public class BuyerProfile extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    @Column(name = "occupation", length = 64)
    private String occupation;

    /** 学习兴趣标签，JSON 数组 */
    @Column(name = "learning_tags", length = 512)
    private String learningTags;
}
