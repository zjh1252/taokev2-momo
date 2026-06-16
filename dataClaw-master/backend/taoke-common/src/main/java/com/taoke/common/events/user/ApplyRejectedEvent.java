package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 角色入驻审核驳回事件。
 * <p>
 * 由管理员驳回后发布，消费方可据此执行通知等后续逻辑。
 * <p>
 * Topic 自动推导：{@code user.apply.rejected}
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
@Getter
public class ApplyRejectedEvent extends DomainEvent {

    /** 被驳回的角色编码 */
    private String role;

    /** 驳回原因 */
    private String reason;

    /** Jackson 反序列化 */
    protected ApplyRejectedEvent() {
    }

    public ApplyRejectedEvent(String role, Integer userId, String reason) {
        super("UserRole", String.valueOf(userId));
        this.role = role;
        this.reason = reason;
    }
}
