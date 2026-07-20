package com.taoke.user.service;

import com.taoke.common.enums.NotificationType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.user.api.NotificationService;
import com.taoke.user.dto.notification.NotificationVO;
import com.taoke.user.entity.Notification;
import com.taoke.user.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 站内信通知服务实现。
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public void send(Integer userId, NotificationType type, String title, String content,
                     String relatedId, String relatedUrl) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type.name());
        n.setTitle(title);
        n.setContent(content);
        n.setRelatedId(relatedId);
        n.setRelatedUrl(relatedUrl);
        n.setIsRead(0);
        notificationRepository.save(n);
        log.debug("站内信已发送: userId={}, type={}, title={}", userId, type, title);
    }

    @Override
    public boolean exists(Integer userId, NotificationType type, String relatedId) {
        if (userId == null || type == null || relatedId == null || relatedId.isBlank()) {
            return false;
        }
        return notificationRepository.existsByUserIdAndTypeAndRelatedId(userId, type.name(), relatedId);
    }

    @Override
    @Transactional
    public void sendBatch(List<Integer> userIds, NotificationType type, String title,
                          String content, String relatedUrl) {
        List<Notification> notifications = userIds.stream().map(uid -> {
            Notification n = new Notification();
            n.setUserId(uid);
            n.setType(type.name());
            n.setTitle(title);
            n.setContent(content);
            n.setRelatedUrl(relatedUrl);
            n.setIsRead(0);
            return n;
        }).toList();
        notificationRepository.saveAll(notifications);
        log.info("批量站内信已发送: count={}, type={}, title={}", userIds.size(), type, title);
    }

    @Override
    public PageResponse<NotificationVO> listByUser(Integer userId, int page, int size) {
        PageRequest pageable = PageRequest.of(page - 1, size);
        Page<Notification> result = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.of(result, this::toVO);
    }

    @Override
    public long countUnread(Integer userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, 0);
    }

    @Override
    @Transactional
    public void markRead(Integer userId, Integer notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "通知不存在"));
        if (!n.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作该通知");
        }
        if (n.getIsRead() == 0) {
            n.setIsRead(1);
            notificationRepository.save(n);
        }
    }

    @Override
    @Transactional
    public void markAllRead(Integer userId) {
        int updated = notificationRepository.markAllReadByUserId(userId);
        log.debug("批量标记已读: userId={}, count={}", userId, updated);
    }

    private NotificationVO toVO(Notification n) {
        NotificationVO vo = new NotificationVO();
        vo.setId(n.getId());
        vo.setType(n.getType());
        vo.setTitle(n.getTitle());
        vo.setContent(n.getContent());
        vo.setRelatedId(n.getRelatedId());
        vo.setRelatedUrl(n.getRelatedUrl());
        vo.setIsRead(n.getIsRead());
        vo.setCreatedAt(n.getCreatedAt());
        try {
            vo.setTypeLabel(NotificationType.valueOf(n.getType()).getLabel());
        } catch (IllegalArgumentException e) {
            vo.setTypeLabel(n.getType());
        }
        return vo;
    }
}
