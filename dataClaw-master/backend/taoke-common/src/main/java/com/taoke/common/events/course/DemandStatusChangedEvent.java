package com.taoke.common.events.course;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 需求状态变更事件 — 用于触发站内信通知等异步处理
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Getter
public class DemandStatusChangedEvent extends DomainEvent {

    /** 需求 ID */
    private Integer demandId;

    /** 需求标题 */
    private String demandTitle;

    /** 需求提交人用户 ID */
    private Integer demandUserId;

    /** 变更前状态值 */
    private Integer oldStatus;

    /** 变更后状态值 */
    private Integer newStatus;

    protected DemandStatusChangedEvent() {
    }

    public DemandStatusChangedEvent(Integer demandId, String demandTitle,
                                     Integer demandUserId, Integer oldStatus, Integer newStatus) {
        super("Demand", String.valueOf(demandId));
        this.demandId = demandId;
        this.demandTitle = demandTitle;
        this.demandUserId = demandUserId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
    }
}
