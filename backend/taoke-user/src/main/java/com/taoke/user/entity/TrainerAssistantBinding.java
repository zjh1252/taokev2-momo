package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 专家-助理绑定关系实体。
 * <p>
 * 绑定状态：1=生效，2=待确认，3=已解绑
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_trainer_assistant_bindings")
public class TrainerAssistantBinding extends BaseEntity {

    /** 专家用户 ID */
    @Column(name = "trainer_user_id", nullable = false)
    private Integer trainerUserId;

    /** 助理用户 ID */
    @Column(name = "assistant_user_id", nullable = false)
    private Integer assistantUserId;

    /** 绑定状态：1=生效，2=待确认，3=已解绑 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 2;

    /** 确认时间 */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    /** 授权范围（JSON 数组） */
    @Column(name = "auth_scope", length = 512)
    private String authScope;
}
