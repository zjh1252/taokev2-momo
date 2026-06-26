package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 专家案例审核通过事件
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:30
 */
@Getter
public class TrainerCaseApprovedEvent extends DomainEvent {

    /** 案例 ID */
    private Integer caseId;

    /** 案例标题 */
    private String caseTitle;

    /** 专家用户 ID（用于发送通知） */
    private Integer trainerUserId;

    protected TrainerCaseApprovedEvent() {
    }

    public TrainerCaseApprovedEvent(Integer caseId, String caseTitle, Integer trainerUserId) {
        super("TrainerCase", String.valueOf(caseId));
        this.caseId = caseId;
        this.caseTitle = caseTitle;
        this.trainerUserId = trainerUserId;
    }
}
