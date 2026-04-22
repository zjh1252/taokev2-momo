package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 经纪公司-经纪人成员实体。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_enterprise_agent_members")
public class EnterpriseAgentMember extends BaseEntity {

    /** 经纪公司 ID */
    @Column(name = "enterprise_agent_id", nullable = false)
    private Integer enterpriseAgentId;

    /** 经纪人用户 ID */
    @Column(name = "agent_user_id", nullable = false)
    private Integer agentUserId;

    /** 是否负责人：0=否，1=是 */
    @Column(name = "is_leader", nullable = false, columnDefinition = "tinyint")
    private Integer isLeader = 0;

    /** 加入时间 */
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    /** 绑定状态：1=ACTIVE 2=PENDING 3=UNBOUND 4=REJECTED；缺省按 1 处理（兼容旧数据） */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 1;

    /** 备注 */
    @Column(name = "note", length = 500)
    private String note;

    /** 拒绝理由（status=REJECTED 时填充） */
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** 发起方用户 ID（用于审计） */
    @Column(name = "initiator_user_id")
    private Integer initiatorUserId;

    /** 确认时间 */
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
}
