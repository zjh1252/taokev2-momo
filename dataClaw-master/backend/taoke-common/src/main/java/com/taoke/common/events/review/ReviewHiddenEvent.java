package com.taoke.common.events.review;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 评价被后台隐藏事件
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
@Getter
public class ReviewHiddenEvent extends DomainEvent {

    private Integer reviewId;
    private Integer reviewerUserId;
    private String scope;
    private Integer targetId;
    private String targetTitle;

    protected ReviewHiddenEvent() {
    }

    public ReviewHiddenEvent(Integer reviewId, Integer reviewerUserId,
                             String scope, Integer targetId, String targetTitle) {
        super("Review", String.valueOf(reviewId));
        this.reviewId = reviewId;
        this.reviewerUserId = reviewerUserId;
        this.scope = scope;
        this.targetId = targetId;
        this.targetTitle = targetTitle;
    }
}
