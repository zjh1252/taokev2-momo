package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 培训机构「公司资料」审核结果事件。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Getter
public class InstitutionCompanyInfoAuditedEvent extends DomainEvent {

    private boolean approved;

    /** 机构对应的用户 ID */
    private Integer institutionUserId;

    /** 机构主键（user_institutions.id） */
    private Integer institutionId;

    /** 机构名称（站内信摘要） */
    private String summary;

    /** 驳回原因 */
    private String rejectReason;

    protected InstitutionCompanyInfoAuditedEvent() {
    }

    public InstitutionCompanyInfoAuditedEvent(boolean approved, Integer institutionUserId, Integer institutionId,
                                              String summary, String rejectReason) {
        super("InstitutionCompanyInfo", String.valueOf(institutionUserId));
        this.approved = approved;
        this.institutionUserId = institutionUserId;
        this.institutionId = institutionId;
        this.summary = summary;
        this.rejectReason = rejectReason;
    }
}
