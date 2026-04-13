package com.taoke.user.eventlistener;

import com.taoke.common.enums.NotificationType;
import com.taoke.common.eventbus.DomainEventListener;
import com.taoke.common.events.user.TrainerCaseApprovedEvent;
import com.taoke.common.events.user.TrainerCaseRejectedEvent;
import com.taoke.common.events.user.TrainerHighlightApprovedEvent;
import com.taoke.common.events.user.TrainerHighlightRejectedEvent;
import com.taoke.user.api.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 专家内容事件消费者 — 处理案例、精彩瞬间审核相关领域事件，发送站内信通知。
 *
 * @author Fangxinxin
 * @date 2026-04-13 10:00
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TrainerContentEventListener {

    private final NotificationService notificationService;

    /**
     * 案例审核通过
     */
    @DomainEventListener
    public void onCaseApproved(TrainerCaseApprovedEvent event) {
        log.info("收到案例审核通过事件: caseId={}, trainerUserId={}, eventId={}",
                event.getCaseId(), event.getTrainerUserId(), event.getEventId());

        notificationService.send(
                event.getTrainerUserId(),
                NotificationType.CASE_REVIEW,
                "案例审核通过",
                "恭喜！您发布的案例「" + event.getCaseTitle() + "」已审核通过并展示。",
                String.valueOf(event.getCaseId()),
                "/cases/" + event.getCaseId()
        );
    }

    /**
     * 案例审核驳回
     */
    @DomainEventListener
    public void onCaseRejected(TrainerCaseRejectedEvent event) {
        log.info("收到案例审核驳回事件: caseId={}, trainerUserId={}, eventId={}",
                event.getCaseId(), event.getTrainerUserId(), event.getEventId());

        String reason = event.getRejectReason();
        String content = "您发布的案例「" + event.getCaseTitle() + "」未通过审核。"
                + (reason != null && !reason.isBlank() ? "驳回原因：" + reason : "");

        notificationService.send(
                event.getTrainerUserId(),
                NotificationType.CASE_REVIEW,
                "案例审核未通过",
                content,
                String.valueOf(event.getCaseId()),
                "/dashboard/cases/manage"
        );
    }

    /**
     * 精彩瞬间审核通过
     */
    @DomainEventListener
    public void onHighlightApproved(TrainerHighlightApprovedEvent event) {
        log.info("收到精彩瞬间审核通过事件: highlightId={}, trainerUserId={}, eventId={}",
                event.getHighlightId(), event.getTrainerUserId(), event.getEventId());

        notificationService.send(
                event.getTrainerUserId(),
                NotificationType.HIGHLIGHT_REVIEW,
                "精彩瞬间审核通过",
                "恭喜！您发布的精彩瞬间「" + event.getTitle() + "」已审核通过并展示。",
                String.valueOf(event.getHighlightId()),
                "/highlights/" + event.getHighlightId()
        );
    }

    /**
     * 精彩瞬间审核驳回
     */
    @DomainEventListener
    public void onHighlightRejected(TrainerHighlightRejectedEvent event) {
        log.info("收到精彩瞬间审核驳回事件: highlightId={}, trainerUserId={}, eventId={}",
                event.getHighlightId(), event.getTrainerUserId(), event.getEventId());

        String reason = event.getRejectReason();
        String content = "您发布的精彩瞬间「" + event.getTitle() + "」未通过审核。"
                + (reason != null && !reason.isBlank() ? "驳回原因：" + reason : "");

        notificationService.send(
                event.getTrainerUserId(),
                NotificationType.HIGHLIGHT_REVIEW,
                "精彩瞬间审核未通过",
                content,
                String.valueOf(event.getHighlightId()),
                "/dashboard/highlights/manage"
        );
    }
}
