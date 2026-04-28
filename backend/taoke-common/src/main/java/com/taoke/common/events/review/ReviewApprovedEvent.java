package com.taoke.common.events.review;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 评价审核通过事件
 *
 * <p>由后台审核人员审核通过后发布，消费方据此向评价提交人发送站内信通知。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
@Getter
public class ReviewApprovedEvent extends DomainEvent {

    /** 评价 ID */
    private Integer reviewId;

    /** 评价提交人用户 ID */
    private Integer reviewerUserId;

    /** 评价范围：COURSE / TRAINER / INSTITUTION */
    private String scope;

    /** 被评价对象 ID（课程 ID / 专家 user_id / 机构 ID） */
    private Integer targetId;

    /** 关联资源标题（用于通知文案） */
    private String targetTitle;

    /** Jackson 反序列化 */
    protected ReviewApprovedEvent() {
    }

    public ReviewApprovedEvent(Integer reviewId, Integer reviewerUserId,
                               String scope, Integer targetId, String targetTitle) {
        super("Review", String.valueOf(reviewId));
        this.reviewId = reviewId;
        this.reviewerUserId = reviewerUserId;
        this.scope = scope;
        this.targetId = targetId;
        this.targetTitle = targetTitle;
    }
}
