package com.taoke.course.entity.cms;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDateTime;

/**
 * 推荐位布局配置（如首页大卡是否固定）
 *
 * @author Fangxinxin
 * @date 2026-06-16 14:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "recommendation_slot_configs")
public class RecommendationSlotConfig {

    @Id
    @Column(name = "slot_code", nullable = false, length = 50)
    private String slotCode;

    @Column(name = "lock_main", nullable = false)
    private Boolean lockMain = true;

    @Column(name = "lock_middle", nullable = false)
    private Boolean lockMiddle = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
