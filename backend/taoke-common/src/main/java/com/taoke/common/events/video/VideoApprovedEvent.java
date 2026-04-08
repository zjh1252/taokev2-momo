package com.taoke.common.events.video;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 录播课审核通过事件
 * <p>
 * 由管理员审核通过后发布，消费方据此发送站内信通知给发布者。
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:30
 */
@Getter
public class VideoApprovedEvent extends DomainEvent {

    /** 录播课ID */
    private Integer videoId;

    /** 发布者用户ID */
    private Integer publisherId;

    /** 录播课标题 */
    private String videoTitle;

    /** Jackson 反序列化 */
    protected VideoApprovedEvent() {
    }

    public VideoApprovedEvent(Integer videoId, Integer publisherId, String videoTitle) {
        super("Video", String.valueOf(videoId));
        this.videoId = videoId;
        this.publisherId = publisherId;
        this.videoTitle = videoTitle;
    }
}
