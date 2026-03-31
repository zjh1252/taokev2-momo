package com.taoke.common.eventbus;

import java.lang.annotation.*;

/**
 * 领域事件消费注解 — 标记在方法上，声明该方法消费指定 topic 的事件。
 * <p>
 * 底层由中间件适配层（如 {@code RabbitEventListenerRegistrar}）自动扫描并注册，
 * 业务代码不直接依赖 {@code @RabbitListener} / {@code @KafkaListener}。
 * <p>
 * 使用示例：
 * <pre>{@code
 * @DomainEventListener(topic = RoleApprovedEvent.TOPIC)
 * public void onRoleApproved(RoleApprovedEvent event) {
 *     // 处理逻辑
 * }
 * }</pre>
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DomainEventListener {

    /**
     * 订阅的事件 topic，使用事件类的 TOPIC 常量引用，禁止字符串字面量。
     */
    String topic();
}
