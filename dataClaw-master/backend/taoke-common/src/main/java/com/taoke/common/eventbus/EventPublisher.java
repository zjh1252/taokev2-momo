package com.taoke.common.eventbus;

/**
 * 事件发布接口 — 业务代码唯一依赖点。
 * <p>
 * 底层实现可切换（RabbitMQ / Kafka 等），业务代码无感知。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
public interface EventPublisher {

    /**
     * 发布领域事件
     *
     * @param event 领域事件（topic 由事件自身定义）
     */
    void publish(DomainEvent event);
}
