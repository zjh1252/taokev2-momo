package com.taoke.user.eventlistener;

import com.taoke.common.enums.NotificationType;
import com.taoke.common.eventbus.DomainEventListener;
import com.taoke.common.events.video.VideoApprovedEvent;
import com.taoke.common.events.video.VideoPurchasedEvent;
import com.taoke.user.api.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * 录播课事件消费者 — 处理录播课相关领域事件。
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:30
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class VideoEventListener {

    private final NotificationService notificationService;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * 录播课审核通过 — 发送站内信通知给发布者
     */
    @DomainEventListener
    public void onVideoApproved(VideoApprovedEvent event) {
        Integer publisherId = event.getPublisherId();
        String videoTitle = event.getVideoTitle();
        Integer videoId = event.getVideoId();

        log.info("收到录播课审核通过事件: videoId={}, publisherId={}, eventId={}",
                videoId, publisherId, event.getEventId());

        notificationService.send(
                publisherId,
                NotificationType.VIDEO_REVIEW,
                "录播课审核通过",
                "恭喜！您发布的录播课「" + videoTitle + "」已审核通过并上架，用户可以开始学习了。",
                String.valueOf(videoId),
                "/videos/" + videoId
        );
    }

    /**
     * 录播课被购买 — 发送站内信通知给课程作者
     */
    @DomainEventListener
    public void onVideoPurchased(VideoPurchasedEvent event) {
        Integer publisherId = event.getPublisherId();
        Integer videoId = event.getVideoId();
        String videoTitle = event.getVideoTitle();
        String buyerName = event.getBuyerName();
        String paidAmount = event.getPaidAmount().toPlainString();
        String purchaseTime = LocalDateTime.ofInstant(event.getTimestamp(), ZoneId.of("Asia/Shanghai"))
                .format(TIME_FMT);

        log.info("收到录播课购买事件: videoId={}, buyerUserId={}, publisherId={}, eventId={}",
                videoId, event.getBuyerUserId(), publisherId, event.getEventId());

        notificationService.send(
                publisherId,
                NotificationType.VIDEO_PURCHASED,
                "课程被购买",
                buyerName + " 花费了 " + paidAmount + " 元，于 " + purchaseTime
                        + "，购买了您的录播课「" + videoTitle + "」。",
                String.valueOf(videoId),
                "/videos/" + videoId
        );
    }
}
