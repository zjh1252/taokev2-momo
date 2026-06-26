package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 专家案例审核驳回事件
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:30
 */
@Getter
public class TrainerCaseRejectedEvent extends DomainEvent {

    private Integer caseId;
    private String caseTitle;
    private Integer trainerUserId;
    private String rejectReason;

    protected TrainerCaseRejectedEvent() {
    }

    public TrainerCaseRejectedEvent(Integer caseId, String caseTitle,
                                    Integer trainerUserId, String rejectReason) {
        super("TrainerCase", String.valueOf(caseId));
        this.caseId = caseId;
        this.caseTitle = caseTitle;
        this.trainerUserId = trainerUserId;
        this.rejectReason = rejectReason;
    }
}
