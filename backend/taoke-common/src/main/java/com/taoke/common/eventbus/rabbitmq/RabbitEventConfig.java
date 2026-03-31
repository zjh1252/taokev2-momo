package com.taoke.common.eventbus.rabbitmq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.eventbus.EventBusProperties;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 事件总线 RabbitMQ 配置 — Topic Exchange + JSON 消息序列化。
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

    /**
     * 注入全局 ObjectMapper，保证 MQ 消息与 REST API 的序列化规则（时区、日期格式、null 处理）一致。
     */
    @Bean
    public MessageConverter jackson2JsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
