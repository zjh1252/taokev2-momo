package com.taoke.common.events.video;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * 录播课被购买事件
 * <p>
 * 支付成功后发布，消费方据此发送站内信通知给课程发布者。
 *
 * @author Fangxinxin
 * @date 2026-04-08 20:00
 */
@Getter
public class VideoPurchasedEvent extends DomainEvent {

    /** 录播课ID */
    private Integer videoId;

    /** 录播课标题 */
    private String videoTitle;

    /** 发布者用户ID */
    private Integer publisherId;

    /** 购买者用户ID */
    private Integer buyerUserId;

    /** 购买者用户名 */
    private String buyerName;

    /** 支付金额 */
    private BigDecimal paidAmount;

    /** Jackson 反序列化 */
    protected VideoPurchasedEvent() {
    }

    public VideoPurchasedEvent(Integer videoId, String videoTitle, Integer publisherId,
                               Integer buyerUserId, String buyerName, BigDecimal paidAmount) {
        super("Video", String.valueOf(videoId));
        this.videoId = videoId;
        this.videoTitle = videoTitle;
        this.publisherId = publisherId;
        this.buyerUserId = buyerUserId;
        this.buyerName = buyerName;
        this.paidAmount = paidAmount;
    }
}
