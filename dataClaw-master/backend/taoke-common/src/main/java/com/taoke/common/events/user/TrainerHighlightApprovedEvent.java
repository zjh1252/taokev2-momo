package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 专家精彩瞬间审核通过事件
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Getter
public class TrainerHighlightApprovedEvent extends DomainEvent {

    private Integer highlightId;
    private String title;
    private Integer trainerUserId;

    protected TrainerHighlightApprovedEvent() {
    }

    public TrainerHighlightApprovedEvent(Integer highlightId, String title, Integer trainerUserId) {
        super("TrainerHighlight", String.valueOf(highlightId));
        this.highlightId = highlightId;
        this.title = title;
        this.trainerUserId = trainerUserId;
    }
}
