package com.taoke.course.entity.cms;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 推荐资源位配置
 *
 * @author Fangxinxin
 * @date 2026-06-12 18:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "recommended_resources")
public class RecommendedResource extends BaseEntity {

    @Column(name = "slot_code", nullable = false, length = 50)
    private String slotCode;

    @Column(name = "resource_type", nullable = false, length = 20)
    private String resourceType;

    @Column(name = "resource_id", nullable = false)
    private Integer resourceId;

    /** 擅长领域分类 ID，仅 TRAINER_CATEGORY_EXPERT 使用 */
    @Column(name = "category_id")
    private Integer categoryId;

    /** PRIMARY=正式推荐 BACKUP=备选 */
    @Column(name = "role_type", nullable = false, length = 20)
    private String roleType = "PRIMARY";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "cover_url", length = 512)
    private String coverUrl;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "expertise_override", length = 200)
    private String expertiseOverride;

    @Column(name = "key_tags", length = 200)
    private String keyTags;

    @Column(name = "admin_note", length = 500)
    private String adminNote;
}
