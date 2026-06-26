package com.taoke.common.events.user;

import com.taoke.common.eventbus.DomainEvent;
import lombok.Getter;

/**
 * 新用户注册事件 — SMS 登录自动注册或手动注册时发布。
 * <p>
 * 消费方可据此发送欢迎通知、初始化用户偏好等。
 * <p>
 * Topic 自动推导：{@code user.new.user.registered}
 *
 * @author Fangxinxin
 * @date 2026-04-03 12:30
 */
@Getter
public class NewUserRegisteredEvent extends DomainEvent {

    /** 新用户手机号 */
    private String phone;

    /** Jackson 反序列化 */
    protected NewUserRegisteredEvent() {
    }

    public NewUserRegisteredEvent(Integer userId, String phone) {
        super("User", String.valueOf(userId));
        this.phone = phone;
    }
}
