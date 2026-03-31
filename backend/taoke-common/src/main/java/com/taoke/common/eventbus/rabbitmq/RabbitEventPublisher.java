package com.taoke.common.eventbus.rabbitmq;

import com.taoke.common.eventbus.DomainEvent;
import com.taoke.common.eventbus.EventBusProperties;
import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.eventbus.TopicResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ 事件发布实现 — 将领域事件发送到 Topic Exchange。
 * <p>
 * routing key 使用事件的 {@link DomainEvent#getTopic()}。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Slf4j
@Component
@ConditionalOnClass(RabbitTemplate.class)
@RequiredArgsConstructor
public class RabbitEventPublisher implements EventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final EventBusProperties properties;

    @Override
    public void publish(DomainEvent event) {
        String topic = TopicResolver.resolve(event.getClass());
        log.info("发布领域事件: topic={}, eventId={}", topic, event.getEventId());
        rabbitTemplate.convertAndSend(properties.getExchange(), topic, event);
    }
}
