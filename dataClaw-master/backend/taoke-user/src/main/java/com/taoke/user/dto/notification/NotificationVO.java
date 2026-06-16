package com.taoke.user.dto.notification;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 站内信通知视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
@Data
public class NotificationVO {

    private Integer id;

    /** 通知类型 */
    private String type;

    /** 类型中文标签 */
    private String typeLabel;

    private String title;
    private String content;
    private String relatedId;
    private String relatedUrl;

    /** 0=未读，1=已读 */
    private Integer isRead;

    private LocalDateTime createdAt;
}
