package com.taoke.course.entity.video;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 录播课供应商 — 对应 video_suppliers 表
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "video_suppliers")
public class VideoSupplier extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName = "";

    @Column(name = "member_type", nullable = false, length = 30)
    private String memberType = "TRAINING_ORG";

    @Column(name = "enabled", nullable = false, columnDefinition = "TINYINT(1)")
    private Boolean enabled = true;
}
