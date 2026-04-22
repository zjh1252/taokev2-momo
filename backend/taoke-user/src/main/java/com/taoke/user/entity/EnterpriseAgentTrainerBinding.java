package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 经纪公司-专家绑定关系实体。
 * <p>
 * 绑定状态：1=ACTIVE 生效，2=PENDING 待确认，3=UNBOUND 已解绑，4=REJECTED 已拒绝。
 *
 * @author Fangxinxin
 * @date 2026-04-21 14:10
 */
@Getter
@Setter
@Entity
@Table(name = "user_enterprise_agent_trainer_bindings")
public class EnterpriseAgentTrainerBinding extends BaseEntity {

    /** 经纪公司 ID（user_enterprise_agents.id） */
    @Column(name = "enterprise_agent_id", nullable = false)
    private Integer enterpriseAgentId;

    /** 专家用户 ID */
    @Column(name = "trainer_user_id", nullable = false)
    private Integer trainerUserId;

    /** 绑定状态 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 2;

    /** 确认时间 */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    /** 拒绝理由 */
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** 备注 */
    @Column(name = "note", length = 500)
    private String note;

    /** 发起方用户 ID（用于审计） */
    @Column(name = "initiator_user_id")
    private Integer initiatorUserId;
}
