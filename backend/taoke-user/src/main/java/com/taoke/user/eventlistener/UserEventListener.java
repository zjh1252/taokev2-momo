package com.taoke.user.eventlistener;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.eventbus.DomainEventListener;
import com.taoke.common.events.user.ApplyPassedEvent;
import com.taoke.user.entity.Trainer;
import com.taoke.user.repository.TrainerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 用户模块事件消费者 — 处理用户相关领域事件。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventListener {

    private final TrainerRepository trainerRepository;

    /**
     * 角色入驻审核通过 — 同步更新业务主表状态、发送通知等。
     */
    @DomainEventListener
    @Transactional
    public void onApplyPassed(ApplyPassedEvent event) {
        Integer userId = Integer.valueOf(event.getAggregateId());
        String role = event.getRole();
        log.info("收到角色审核通过事件: userId={}, role={}, eventId={}",
                userId, role, event.getEventId());

        if (BusinessRole.Code.TRAINER.equals(role)) {
            trainerRepository.findByUserId(userId).ifPresent(trainer -> {
                trainer.setStatus(2);
                trainer.setApprovedAt(LocalDateTime.now());
                trainerRepository.save(trainer);
                log.info("专家档案状态已更新为审核通过: trainerId={}, userId={}", trainer.getId(), userId);
            });
        }

        // TODO 后续实现：发送短信/站内信通知用户
        // TODO 后续实现：初始化角色对应的默认资源
    }
}
