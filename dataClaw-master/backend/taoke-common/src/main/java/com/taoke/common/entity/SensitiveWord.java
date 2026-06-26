package com.taoke.common.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 敏感词实体
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "sys_sensitive_words")
public class SensitiveWord extends BaseEntity {

    /** 敏感词内容 */
    @Column(name = "word", nullable = false, length = 100, unique = true)
    private String word;

    /** 分类：1=政治敏感, 2=色情低俗, 3=暴力, 4=广告, 5=其他 */
    @Column(name = "category", nullable = false, columnDefinition = "tinyint(2)")
    private Integer category;

    /** 替换文本 */
    @Column(name = "replacement", nullable = false, length = 100)
    private String replacement;

    /** 是否启用 */
    @Column(name = "enabled", nullable = false, columnDefinition = "tinyint(1)")
    private Boolean enabled;
}
