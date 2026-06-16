package com.taoke.user.api;

import com.taoke.common.enums.NotificationType;
import com.taoke.common.response.PageResponse;
import com.taoke.user.dto.notification.NotificationVO;

import java.util.List;

/**
 * 站内信通知能力接口。
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
public interface NotificationService {

    /**
     * 发送单条通知
     *
     * @param userId     接收用户 ID
     * @param type       通知类型
     * @param title      标题
     * @param content    正文（可为 null）
     * @param relatedId  关联业务 ID（可为 null）
     * @param relatedUrl 跳转路径（可为 null）
     */
    void send(Integer userId, NotificationType type, String title, String content,
              String relatedId, String relatedUrl);

    /**
     * 批量发送通知（系统公告场景）
     *
     * @param userIds    接收用户 ID 列表
     * @param type       通知类型
     * @param title      标题
     * @param content    正文
     * @param relatedUrl 跳转路径（可为 null）
     */
    void sendBatch(List<Integer> userIds, NotificationType type, String title,
                   String content, String relatedUrl);

    /**
     * 分页查询用户通知
     */
    PageResponse<NotificationVO> listByUser(Integer userId, int page, int size);

    /**
     * 统计用户未读通知数
     */
    long countUnread(Integer userId);

    /**
     * 标记单条通知为已读
     */
    void markRead(Integer userId, Integer notificationId);

    /**
     * 标记用户全部通知为已读
     */
    void markAllRead(Integer userId);
}
