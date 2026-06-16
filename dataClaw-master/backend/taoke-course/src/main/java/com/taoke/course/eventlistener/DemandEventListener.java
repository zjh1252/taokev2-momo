package com.taoke.course.eventlistener;

import com.taoke.common.enums.NotificationType;
import com.taoke.common.eventbus.DomainEventListener;
import com.taoke.common.events.course.DemandStatusChangedEvent;
import com.taoke.course.enums.DemandStatus;
import com.taoke.user.api.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 需求事件消费者 — 处理需求状态变更领域事件，发送站内信通知。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemandEventListener {

    private final NotificationService notificationService;

    @DomainEventListener
    public void onDemandStatusChanged(DemandStatusChangedEvent event) {
        log.info("收到需求状态变更事件: demandId={}, userId={}, {}→{}, eventId={}",
                event.getDemandId(), event.getDemandUserId(),
                event.getOldStatus(), event.getNewStatus(), event.getEventId());

        DemandStatus newStatus = DemandStatus.of(event.getNewStatus());
        String title = buildTitle(newStatus);
        String content = buildContent(event, newStatus);

        notificationService.send(
                event.getDemandUserId(),
                NotificationType.DEMAND_STATUS,
                title,
                content,
                String.valueOf(event.getDemandId()),
                "/dashboard/demands"
        );
    }

    private String buildTitle(DemandStatus newStatus) {
        return switch (newStatus) {
            case PROCESSING -> "需求已受理";
            case MATCHED -> "需求已匹配";
            case COMPLETED -> "需求已完成";
            case CANCELLED -> "需求已取消";
            default -> "需求状态更新";
        };
    }

    private String buildContent(DemandStatusChangedEvent event, DemandStatus newStatus) {
        String demandTitle = event.getDemandTitle();
        if (demandTitle == null || demandTitle.isBlank()) {
            demandTitle = "您的培训需求";
        } else {
            demandTitle = "您的需求「" + demandTitle + "」";
        }
        return switch (newStatus) {
            case PROCESSING -> demandTitle + "已被客服受理，正在为您匹配合适的方案。";
            case MATCHED -> demandTitle + "已成功匹配，客服将尽快与您联系。";
            case COMPLETED -> demandTitle + "已完成，感谢您的信任！";
            case CANCELLED -> demandTitle + "已取消。";
            default -> demandTitle + "状态已更新为「" + newStatus.getLabel() + "」。";
        };
    }
}
