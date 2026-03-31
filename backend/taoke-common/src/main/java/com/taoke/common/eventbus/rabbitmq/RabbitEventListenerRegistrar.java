package com.taoke.common.eventbus.rabbitmq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.eventbus.DomainEvent;
import com.taoke.common.eventbus.DomainEventListener;
import com.taoke.common.eventbus.EventBusProperties;
import com.taoke.common.eventbus.TopicResolver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 扫描 {@link DomainEventListener} 注解，自动注册 RabbitMQ 队列与消费者。
 * <p>
 * Topic 由方法参数类型通过 {@link TopicResolver} 自动推导，启动时校验 topic 唯一性。
 * <p>
 * 启动流程：
 * <ol>
 *   <li>BeanPostProcessor 阶段：扫描所有 Bean 的方法，收集 {@code @DomainEventListener} 元数据</li>
 *   <li>SmartInitializingSingleton 阶段：校验 topic 唯一性 → 创建 Queue → 绑定 Exchange → 注册 MessageListener</li>
 * </ol>
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Slf4j
@Component
@ConditionalOnClass(RabbitTemplate.class)
public class RabbitEventListenerRegistrar implements BeanPostProcessor, SmartInitializingSingleton, ApplicationContextAware {

    private ApplicationContext applicationContext;
    private final List<ListenerMeta> listenerMetas = new ArrayList<>();

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        for (Method method : bean.getClass().getDeclaredMethods()) {
            DomainEventListener annotation = method.getAnnotation(DomainEventListener.class);
            if (annotation == null) {
                continue;
            }

            validateListenerMethod(method);

            Class<? extends DomainEvent> eventType =
                    (Class<? extends DomainEvent>) method.getParameterTypes()[0];
            String topic = TopicResolver.resolve(eventType);

            listenerMetas.add(new ListenerMeta(bean, method, eventType, topic));
            log.debug("发现事件监听器: {}.{}() → topic={}, eventType={}",
                    bean.getClass().getSimpleName(), method.getName(), topic, eventType.getSimpleName());
        }
        return bean;
    }

    @Override
    public void afterSingletonsInstantiated() {
        if (listenerMetas.isEmpty()) {
            log.info("未发现 @DomainEventListener 注解，跳过事件消费者注册");
            return;
        }

        validateTopicUniqueness();

        ConnectionFactory connectionFactory = applicationContext.getBean(ConnectionFactory.class);
        AmqpAdmin amqpAdmin = applicationContext.getBean(AmqpAdmin.class);
        EventBusProperties properties = applicationContext.getBean(EventBusProperties.class);
        ObjectMapper objectMapper = applicationContext.getBean(ObjectMapper.class);
        String exchangeName = properties.getExchange();
        String appName = applicationContext.getEnvironment().getProperty("spring.application.name", "taoke-app");

        for (ListenerMeta meta : listenerMetas) {
            String queueName = appName + "." + meta.topic;
            Queue queue = new Queue(queueName, true);
            amqpAdmin.declareQueue(queue);

            Binding binding = BindingBuilder.bind(queue).to(new TopicExchange(exchangeName)).with(meta.topic);
            amqpAdmin.declareBinding(binding);

            SimpleMessageListenerContainer container = new SimpleMessageListenerContainer(connectionFactory);
            container.setQueueNames(queueName);
            container.setMessageListener(message -> {
                try {
                    Object event = objectMapper.readValue(message.getBody(), meta.eventType);
                    meta.method.invoke(meta.bean, event);
                } catch (Exception e) {
                    log.error("事件消费失败: topic={}, method={}.{}()", meta.topic,
                            meta.bean.getClass().getSimpleName(), meta.method.getName(), e);
                }
            });
            container.start();

            log.info("注册事件消费者: queue={}, topic={}, eventType={}, handler={}.{}()",
                    queueName, meta.topic, meta.eventType.getSimpleName(),
                    meta.bean.getClass().getSimpleName(), meta.method.getName());
        }
    }

    /**
     * 启动时校验：不同事件类解析出的 topic 不能重复（同一 topic 允许多个消费者）
     */
    private void validateTopicUniqueness() {
        Map<String, String> topicToClass = new HashMap<>();
        for (ListenerMeta meta : listenerMetas) {
            String existing = topicToClass.get(meta.topic);
            String currentClass = meta.eventType.getName();
            if (existing != null && !existing.equals(currentClass)) {
                throw new IllegalStateException(String.format(
                        "事件 topic 冲突！topic='%s' 同时由 [%s] 和 [%s] 解析得到，请重命名其中一个事件类",
                        meta.topic, existing, currentClass));
            }
            topicToClass.put(meta.topic, currentClass);
        }
    }

    private void validateListenerMethod(Method method) {
        if (method.getParameterCount() != 1) {
            throw new IllegalStateException(
                    "@DomainEventListener 方法必须有且仅有一个参数: " + method);
        }
        if (!DomainEvent.class.isAssignableFrom(method.getParameterTypes()[0])) {
            throw new IllegalStateException(
                    "@DomainEventListener 方法参数必须是 DomainEvent 的子类: " + method);
        }
    }

    private record ListenerMeta(Object bean, Method method, Class<? extends DomainEvent> eventType, String topic) {
    }
}
