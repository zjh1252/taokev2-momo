package com.taoke.common.eventbus;

import com.taoke.common.security.SecurityUtils;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * 领域事件基类 — 所有业务事件的父类。
 * <p>
 * <b>自动填充字段</b>：eventId、timestamp、eventType、operatorId。<br>
 * <b>业务上下文</b>：aggregateType、aggregateId 由子类通过构造器传入。<br>
 * <b>Topic</b>：由 {@link TopicResolver#resolve} 在发布/消费时自动推导，事件本身不关心路由。
 * <p>
 * 子类示例：
 * <pre>{@code
 * public class ApplyPassedEvent extends DomainEvent {
 *     @Getter private String role;
 *
 *     protected ApplyPassedEvent() {}
 *
 *     public ApplyPassedEvent(Integer userId, String role) {
 *         super("UserRole", String.valueOf(userId));
 *         this.role = role;
 *     }
 * }
 * }</pre>
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Getter
public abstract class DomainEvent {

    // ==================== 自动填充（框架层） ====================

    /** 事件唯一 ID，用于幂等判断与链路追踪 */
    private String eventId;

    /** 事件发生时间（UTC），避免时区问题 */
    private Instant timestamp;

    /** 事件类型标识，取自类简名（如 ApplyPassedEvent） */
    private String eventType;

    /** 操作者用户 ID，自动从 SecurityContext 获取；系统事件为 null */
    private Integer operatorId;

    // ==================== 业务上下文（子类传入） ====================

    /** 聚合类型（如 User、Order、Course） */
    private String aggregateType;

    /** 聚合根 ID（字符串化，兼容各类 ID 类型） */
    private String aggregateId;

    /** Jackson 反序列化用，子类也需提供 protected 无参构造器 */
    protected DomainEvent() {
    }

    /**
     * 仅聚合 ID（aggregateType 留空，适用于聚合类型可从 topic 推断的场景）
     *
     * @param aggregateId 聚合根 ID
     */
    protected DomainEvent(String aggregateId) {
        this(null, aggregateId);
    }

    /**
     * 完整构造器
     *
     * @param aggregateType 聚合类型（如 User、Order），无聚合场景传 null
     * @param aggregateId   聚合根 ID，无聚合场景传 null
     */
    protected DomainEvent(String aggregateType, String aggregateId) {
        this.eventId = UUID.randomUUID().toString();
        this.timestamp = Instant.now();
        this.eventType = this.getClass().getSimpleName();
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
        this.operatorId = resolveOperatorId();
    }

    /**
     * 安全获取当前操作者 ID，无登录态时返回 null（系统事件、定时任务等场景）
     */
    private static Integer resolveOperatorId() {
        try {
            return SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            return null;
        }
    }
}
