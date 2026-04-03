package com.taoke.user.eventlistener;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.enums.NotificationType;
import com.taoke.common.eventbus.DomainEventListener;
import com.taoke.common.events.user.ApplyPassedEvent;
import com.taoke.common.events.user.ApplyRejectedEvent;
import com.taoke.common.events.user.NewUserRegisteredEvent;
import com.taoke.user.api.NotificationService;
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
    private final NotificationService notificationService;

    /**
     * 角色入驻审核通过 — 同步更新业务主表状态、发送站内信。
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

        String roleName = getRoleName(role);
        notificationService.send(userId, NotificationType.APPLY_RESULT,
                roleName + "入驻申请已通过",
                "恭喜！您的" + roleName + "入驻申请已审核通过，相关功能已开放。",
                String.valueOf(userId), null);

        // TODO 后续实现：初始化角色对应的默认资源
    }

    /**
     * 新用户注册 — 发送欢迎站内通知。
     */
    @DomainEventListener
    public void onNewUserRegistered(NewUserRegisteredEvent event) {
        Integer userId = Integer.valueOf(event.getAggregateId());
        log.info("收到新用户注册事件: userId={}, phone={}, eventId={}",
                userId, event.getPhone(), event.getEventId());

        notificationService.send(userId, NotificationType.WELCOME,
                "欢迎加入淘课网！",
                "恭喜您注册成为淘课网的一员！在这里，您可以浏览海量培训课程、发现优质专家资源、"
                        + "发布培训需求。您还可以在「修改身份」中申请成为专家、经纪人、机构等角色，解锁更多功能。祝您使用愉快！",
                null, "/dashboard");
    }

    /**
     * 角色入驻审核驳回 — 更新业务主表状态、发送站内信。
     */
    @DomainEventListener
    @Transactional
    public void onApplyRejected(ApplyRejectedEvent event) {
        Integer userId = Integer.valueOf(event.getAggregateId());
        String role = event.getRole();
        String reason = event.getReason();
        log.info("收到角色审核驳回事件: userId={}, role={}, reason={}, eventId={}",
                userId, role, reason, event.getEventId());

        if (BusinessRole.Code.TRAINER.equals(role)) {
            trainerRepository.findByUserId(userId).ifPresent(trainer -> {
                trainer.setStatus(3);
                trainer.setRejectReason(reason);
                trainerRepository.save(trainer);
                log.info("专家档案状态已更新为驳回: trainerId={}, userId={}", trainer.getId(), userId);
            });
        }

        String roleName = getRoleName(role);
        notificationService.send(userId, NotificationType.APPLY_RESULT,
                roleName + "入驻申请未通过",
                "很遗憾，您的" + roleName + "入驻申请未通过审核。原因：" + reason + "。您可以修改资料后重新提交。",
                String.valueOf(userId), null);
    }

    private String getRoleName(String roleCode) {
        try {
            return BusinessRole.valueOf(roleCode).getLabel();
        } catch (IllegalArgumentException e) {
            return roleCode;
        }
    }
}
