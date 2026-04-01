package com.taoke.common.eventbus;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 空操作事件发布器 — 当事件总线未启用时作为兜底，避免依赖注入失败。
 *
 * @author Fangxinxin
 * @date 2026-04-01 21:00
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "taoke.event.enabled", havingValue = "false", matchIfMissing = true)
public class NoOpEventPublisher implements EventPublisher {

    @Override
    public void publish(DomainEvent event) {
        log.debug("事件总线未启用，丢弃事件: topic={}, eventId={}",
                TopicResolver.resolve(event.getClass()), event.getEventId());
    }
}
