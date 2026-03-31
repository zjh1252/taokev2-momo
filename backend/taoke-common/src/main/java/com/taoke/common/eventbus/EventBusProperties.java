package com.taoke.common.eventbus;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 事件总线配置属性，绑定 {@code taoke.event.*}。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Data
@Component
@ConfigurationProperties(prefix = "taoke.event")
public class EventBusProperties {

    /** Topic Exchange 名称 */
    private String exchange = "taoke.events";
}
