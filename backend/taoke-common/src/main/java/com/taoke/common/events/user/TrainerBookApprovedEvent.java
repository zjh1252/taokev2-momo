package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 专家著作审核通过事件
 *
 * @author Fangxinxin
 * @date 2026-06-12 16:00
 */
@Getter
public class TrainerBookApprovedEvent extends DomainEvent {

    private Integer bookId;
    private String bookTitle;
    private Integer trainerUserId;

    protected TrainerBookApprovedEvent() {
    }

    public TrainerBookApprovedEvent(Integer bookId, String bookTitle, Integer trainerUserId) {
        super("TrainerBook", String.valueOf(bookId));
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.trainerUserId = trainerUserId;
    }
}
