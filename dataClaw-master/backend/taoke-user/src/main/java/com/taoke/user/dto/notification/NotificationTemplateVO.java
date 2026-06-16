package com.taoke.user.dto.notification;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通知模板视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
@Data
public class NotificationTemplateVO {
    private Integer id;
    private String code;
    private String channel;
    private String lang;
    private String titleTemplate;
    private String contentTemplate;
    private Integer enabled;
    private String remark;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
