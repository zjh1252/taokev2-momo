package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 专家精彩瞬间审核驳回事件
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Getter
public class TrainerHighlightRejectedEvent extends DomainEvent {

    private Integer highlightId;
    private String title;
    private Integer trainerUserId;
    private String rejectReason;

    protected TrainerHighlightRejectedEvent() {
    }

    public TrainerHighlightRejectedEvent(Integer highlightId, String title,
                                         Integer trainerUserId, String rejectReason) {
        super("TrainerHighlight", String.valueOf(highlightId));
        this.highlightId = highlightId;
        this.title = title;
        this.trainerUserId = trainerUserId;
        this.rejectReason = rejectReason;
    }
}
