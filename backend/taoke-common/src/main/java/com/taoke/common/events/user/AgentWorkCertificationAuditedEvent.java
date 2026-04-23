package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 经纪人工作认证审核结果事件。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Getter
public class AgentWorkCertificationAuditedEvent extends DomainEvent {

    /** 是否通过 */
    private boolean approved;

    /** 经纪人对应的用户 ID */
    private Integer agentUserId;

    /** 工作认证记录 ID */
    private Integer recordId;

    /** 单位名称（站内信摘要） */
    private String summary;

    /** 驳回原因 */
    private String rejectReason;

    /** Jackson 反序列化 */
    protected AgentWorkCertificationAuditedEvent() {
    }

    public AgentWorkCertificationAuditedEvent(boolean approved, Integer agentUserId, Integer recordId,
                                              String summary, String rejectReason) {
        super("AgentWorkCertification", String.valueOf(agentUserId));
        this.approved = approved;
        this.agentUserId = agentUserId;
        this.recordId = recordId;
        this.summary = summary;
        this.rejectReason = rejectReason;
    }
}
