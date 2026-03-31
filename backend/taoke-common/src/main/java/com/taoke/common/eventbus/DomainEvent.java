package com.taoke.common.eventbus;

import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 领域事件基类 — 所有业务事件的父类。
 * <p>
 * 子类需实现 {@link #getTopic()} 并定义 {@code public static final String TOPIC} 常量，
 * 保证 topic 既能在注解中引用（编译期常量），又能在运行时获取。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Getter
public abstract class DomainEvent {

    /** 事件唯一 ID，用于幂等判断与链路追踪 */
    private final String eventId = UUID.randomUUID().toString();

    /** 事件发生时间 */
    private final LocalDateTime occurredAt = LocalDateTime.now();

    /**
     * 事件 topic，格式：{模块}.{实体}.{动作} 或 {模块}.{动作}，全小写点号分隔。
     * <p>
     * 子类示例：{@code return "user.role.approved";}
     */
    public abstract String getTopic();
}
