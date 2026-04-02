package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 通知模板实体 — 支持 {{变量}} 占位符的标题/内容模板。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "notification_templates")
public class NotificationTemplate extends BaseEntity {

    /** 模板编码，唯一标识（如 APPLY_PASSED） */
    @Column(name = "code", nullable = false, length = 32, unique = true)
    private String code;

    /** 通知渠道（in_app / sms / email） */
    @Column(name = "channel", nullable = false, length = 16)
    private String channel = "in_app";

    /** 语言 */
    @Column(name = "lang", nullable = false, length = 10)
    private String lang = "zh-CN";

    /** 标题模板 */
    @Column(name = "title_template", length = 200)
    private String titleTemplate;

    /** 内容模板 */
    @Column(name = "content_template", nullable = false, columnDefinition = "text")
    private String contentTemplate;

    /** 是否启用：0=禁用，1=启用 */
    @Column(name = "enabled", nullable = false, columnDefinition = "tinyint")
    private Integer enabled = 1;

    /** 备注 */
    @Column(name = "remark", length = 255)
    private String remark;
}
