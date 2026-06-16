package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 专家经纪公司资质认证审核结果事件。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Getter
public class EnterpriseAgentCertificationAuditedEvent extends DomainEvent {

    private boolean approved;

    /** 经纪公司对应的用户 ID */
    private Integer enterpriseAgentUserId;

    /** 公司主键（user_enterprise_agents.id） */
    private Integer enterpriseAgentId;

    /** 公司名称（站内信摘要） */
    private String summary;

    /** 驳回原因 */
    private String rejectReason;

    protected EnterpriseAgentCertificationAuditedEvent() {
    }

    public EnterpriseAgentCertificationAuditedEvent(boolean approved, Integer enterpriseAgentUserId,
                                                    Integer enterpriseAgentId, String summary, String rejectReason) {
        super("EnterpriseAgentCertification", String.valueOf(enterpriseAgentUserId));
        this.approved = approved;
        this.enterpriseAgentUserId = enterpriseAgentUserId;
        this.enterpriseAgentId = enterpriseAgentId;
        this.summary = summary;
        this.rejectReason = rejectReason;
    }
}
