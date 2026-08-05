package com.taoke.user.service;

import com.taoke.common.enums.NotificationType;
import com.taoke.user.api.NotificationService;
import com.taoke.user.api.NotificationTemplateService;
import com.taoke.user.dto.notification.RenderedTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * 培训合伙人审核通知发送器。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:10
 */
@Service
@RequiredArgsConstructor
public class AlliancePartnerNotificationSender {

    private final NotificationTemplateService templateService;
    private final NotificationService notificationService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendReviewResult(
            Integer applicationId, Integer userId, String templateCode, String reason) {
        RenderedTemplate rendered = templateService.renderTemplate(
                templateCode,
                Map.of("roleName", "培训合伙人", "reason", reason));
        notificationService.send(
                userId,
                NotificationType.APPLY_RESULT,
                rendered.getTitle(),
                rendered.getContent(),
                String.valueOf(applicationId),
                null);
    }
}
