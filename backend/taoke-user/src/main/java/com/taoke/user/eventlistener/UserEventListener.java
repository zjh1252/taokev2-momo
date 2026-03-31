package com.taoke.user.eventlistener;

import com.taoke.common.eventbus.DomainEventListener;
import com.taoke.common.events.user.ApplyPassedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 用户模块事件消费者 — 处理用户相关领域事件。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Slf4j
@Component
public class UserEventListener {

    /**
     * 角色入驻审核通过 — 可在此执行通知、初始化资源等后续逻辑。
     */
    @DomainEventListener
    public void onApplyPassed(ApplyPassedEvent event) {
        log.info("收到角色审核通过事件: userId={}, role={}, eventId={}",
                event.getAggregateId(), event.getRole(), event.getEventId());

        // TODO 后续实现：发送短信/站内信通知用户
        // TODO 后续实现：初始化角色对应的默认资源
    }
}
