package com.taoke.course.entity.interaction;

import com.taoke.common.entity.BaseEntity;
import com.taoke.course.enums.InteractionTargetType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 用户点赞实体 — 对应 user_likes 表
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_likes")
public class UserLike extends BaseEntity {

    /** 用户 ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 资源类型 */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 32)
    private InteractionTargetType targetType;

    /** 资源主键 */
    @Column(name = "target_id", nullable = false)
    private Integer targetId;
}
