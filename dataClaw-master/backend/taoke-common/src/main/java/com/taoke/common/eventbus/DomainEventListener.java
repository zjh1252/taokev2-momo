package com.taoke.common.eventbus;

import java.lang.annotation.*;

/**
 * 领域事件消费注解 — 标记在方法上，声明该方法消费指定类型的领域事件。
 * <p>
 * Topic 由方法参数类型自动推导（通过 {@link TopicResolver}），无需手动指定。
 * 底层由中间件适配层（如 {@code RabbitEventListenerRegistrar}）自动扫描并注册。
 * <p>
 * 使用示例：
 * <pre>{@code
 * @DomainEventListener
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
}
