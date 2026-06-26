package com.taoke.course.eventlistener;

import com.taoke.common.enums.NotificationType;
import com.taoke.common.eventbus.DomainEventListener;
import com.taoke.common.events.review.ReviewApprovedEvent;
import com.taoke.common.events.review.ReviewHiddenEvent;
import com.taoke.common.events.review.ReviewRejectedEvent;
import com.taoke.user.api.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 评价审核事件消费者 — 处理评价审核状态流转事件，向评价提交人发送站内信。
 *
 * <p>状态语义：</p>
 * <ul>
 *   <li>审核通过 → 通知"您的评价已展示"。</li>
 *   <li>审核驳回 → 通知"您的评价未通过审核"，附驳回原因。</li>
 *   <li>已隐藏 → 通知"您的评价已被隐藏"，运营兜底场景。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewAuditEventListener {

    private final NotificationService notificationService;

    @DomainEventListener
    public void onApproved(ReviewApprovedEvent event) {
        if (event.getReviewerUserId() == null) {
            return;
        }
        log.info("收到评价审核通过事件: reviewId={}, reviewerUserId={}, scope={}, eventId={}",
                event.getReviewId(), event.getReviewerUserId(), event.getScope(), event.getEventId());

        String content = "恭喜！您提交的" + scopeLabel(event.getScope()) + "评价"
                + targetSuffix(event.getTargetTitle()) + "已通过审核并展示。";

        notificationService.send(
                event.getReviewerUserId(),
                NotificationType.REVIEW_AUDIT,
                "评价审核通过",
                content,
                String.valueOf(event.getReviewId()),
                "/dashboard/reviews"
        );
    }

    @DomainEventListener
    public void onRejected(ReviewRejectedEvent event) {
        if (event.getReviewerUserId() == null) {
            return;
        }
        log.info("收到评价审核驳回事件: reviewId={}, reviewerUserId={}, scope={}, eventId={}",
                event.getReviewId(), event.getReviewerUserId(), event.getScope(), event.getEventId());

        String reason = event.getReason();
        StringBuilder content = new StringBuilder("您提交的")
                .append(scopeLabel(event.getScope()))
                .append("评价")
                .append(targetSuffix(event.getTargetTitle()))
                .append("未通过审核。");
        if (reason != null && !reason.isBlank()) {
            content.append("驳回原因：").append(reason);
        }

        notificationService.send(
                event.getReviewerUserId(),
                NotificationType.REVIEW_AUDIT,
                "评价审核未通过",
                content.toString(),
                String.valueOf(event.getReviewId()),
                "/dashboard/reviews"
        );
    }

    @DomainEventListener
    public void onHidden(ReviewHiddenEvent event) {
        if (event.getReviewerUserId() == null) {
            return;
        }
        log.info("收到评价隐藏事件: reviewId={}, reviewerUserId={}, scope={}, eventId={}",
                event.getReviewId(), event.getReviewerUserId(), event.getScope(), event.getEventId());

        String content = "您提交的" + scopeLabel(event.getScope()) + "评价"
                + targetSuffix(event.getTargetTitle()) + "已被运营隐藏，如有疑问请联系客服。";

        notificationService.send(
                event.getReviewerUserId(),
                NotificationType.REVIEW_AUDIT,
                "评价已隐藏",
                content,
                String.valueOf(event.getReviewId()),
                "/dashboard/reviews"
        );
    }

    private String scopeLabel(String scope) {
        if (scope == null) return "";
        return switch (scope) {
            case "COURSE" -> "课程";
            case "TRAINER" -> "专家";
            case "INSTITUTION" -> "机构";
            default -> "";
        };
    }

    private String targetSuffix(String targetTitle) {
        if (targetTitle == null || targetTitle.isBlank()) {
            return "";
        }
        return "「" + targetTitle + "」";
    }
}
