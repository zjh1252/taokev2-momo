package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 角色入驻审核通过事件。
 * <p>
 * 由管理员审核通过后发布，消费方可据此执行后续逻辑（如发送通知、初始化角色资源等）。
 * <p>
 * Topic 自动推导：{@code user.apply.passed}
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Getter
public class ApplyPassedEvent extends DomainEvent {

    /** 审核通过的角色编码（如 TRAINER） */
    private String role;

    /** Jackson 反序列化 */
    protected ApplyPassedEvent() {
    }

    public ApplyPassedEvent(String role, Integer userId) {
        super("UserRole", String.valueOf(userId));
        this.role = role;
    }
}
