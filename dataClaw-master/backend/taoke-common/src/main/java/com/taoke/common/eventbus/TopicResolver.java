package com.taoke.common.eventbus;

/**
 * 事件 Topic 解析器 — 从事件类的包名 + 类名自动推导 topic。
 * <p>
 * 推导规则：
 * <ol>
 *   <li>从包名中提取 {@code events.} 后面的部分作为模块前缀（支持多级，如 {@code events.user.role} → {@code user.role}）</li>
 *   <li>类名去掉 {@code Event} 后缀 → 驼峰拆分 → 小写点号连接</li>
 *   <li>最终 topic = {@code {模块前缀}.{类名推导}}</li>
 * </ol>
 * <p>
 * <b>命名约定</b>：事件类名不要重复包名中已有的模块词，例如在 {@code events.user} 包下，
 * 使用 {@code RegisteredEvent} 而非 {@code UserRegisteredEvent}，避免 topic 出现 {@code user.user.registered}。
 * <p>
 * 示例：
 * <pre>
 * events.user.RegisteredEvent       → user.registered
 * events.user.RoleApprovedEvent     → user.role.approved
 * events.order.CreatedEvent         → order.created
 * events.supply.CertVerifiedEvent   → supply.cert.verified
 * </pre>
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
public final class TopicResolver {

    private static final String EVENTS_SEGMENT = ".events.";

    private TopicResolver() {
    }

    /**
     * 解析事件类的 topic
     *
     * @param eventClass 事件类 Class（必须位于 {@code *.events.{module}.*} 包下）
     * @return topic 字符串，如 {@code user.role.approved}
     * @throws IllegalArgumentException 事件类不在 {@code events.*} 包下时抛出
     */
    public static String resolve(Class<? extends DomainEvent> eventClass) {
        String module = extractModule(eventClass);
        String action = deriveFromClassName(eventClass);

        if (module.isEmpty()) {
            return action;
        }
        return module + "." + action;
    }

    /**
     * 提取模块路径：包名中 {@code events.} 之后的全部内容。
     * <p>
     * {@code com.taoke.common.events.user} → {@code user}
     * {@code com.taoke.common.events.user.role} → {@code user.role}
     */
    private static String extractModule(Class<? extends DomainEvent> eventClass) {
        String packageName = eventClass.getPackageName();
        int idx = packageName.indexOf(EVENTS_SEGMENT);
        if (idx < 0) {
            return "";
        }
        return packageName.substring(idx + EVENTS_SEGMENT.length());
    }

    /**
     * 从类名推导：{@code RoleApprovedEvent} → {@code role.approved}
     */
    private static String deriveFromClassName(Class<? extends DomainEvent> eventClass) {
        String name = eventClass.getSimpleName();
        if (name.endsWith("Event")) {
            name = name.substring(0, name.length() - 5);
        }
        return camelCaseToDot(name);
    }

    /**
     * 驼峰转点号分隔：{@code RoleApproved} → {@code role.approved}
     */
    private static String camelCaseToDot(String input) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (Character.isUpperCase(c) && i > 0) {
                sb.append('.');
            }
            sb.append(Character.toLowerCase(c));
        }
        return sb.toString();
    }
}
