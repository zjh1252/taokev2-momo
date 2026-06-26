package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 站内信通知实体。
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "sys_notifications")
public class Notification extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 通知类型：SYSTEM / APPLY_RESULT / ORDER / COMMENT */
    @Column(name = "type", nullable = false, length = 32)
    private String type;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", columnDefinition = "text")
    private String content;

    /** 关联业务 ID */
    @Column(name = "related_id", length = 64)
    private String relatedId;

    /** 点击跳转路径 */
    @Column(name = "related_url", length = 500)
    private String relatedUrl;

    /** 0=未读，1=已读 */
    @Column(name = "is_read", nullable = false, columnDefinition = "tinyint")
    private Integer isRead = 0;
}
