package com.taoke.common.eventbus.rabbitmq;

import com.taoke.common.eventbus.EventBusProperties;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ 事件总线基础配置 — Topic Exchange + JSON 序列化。
 * <p>
 * 仅在 classpath 存在 RabbitMQ 时激活，实现中间件可插拔。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Configuration
@ConditionalOnClass(RabbitTemplate.class)
public class RabbitEventConfig {

    @Bean
    public TopicExchange domainEventExchange(EventBusProperties properties) {
        return new TopicExchange(properties.getExchange(), true, false);
    }

    @Bean
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
