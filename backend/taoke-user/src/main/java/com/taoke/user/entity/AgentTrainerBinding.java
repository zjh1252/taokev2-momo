package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 经纪人-专家绑定关系实体。
 * <p>
 * 绑定状态：1=生效，2=待确认，3=已解绑
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_agent_trainer_bindings")
public class AgentTrainerBinding extends BaseEntity {

    /** 经纪人用户 ID */
    @Column(name = "agent_user_id", nullable = false)
    private Integer agentUserId;

    /** 专家用户 ID */
    @Column(name = "trainer_user_id", nullable = false)
    private Integer trainerUserId;

    /** 绑定状态：1=生效，2=待确认，3=已解绑 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 2;

    /** 确认时间 */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    /** 备注 */
    @Column(name = "note", length = 255)
    private String note;
}
