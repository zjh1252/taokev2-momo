package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

/**
 * 淘课组织与 UC 组织（root_company）映射。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "user_uc_org_links")
public class UserUcOrgLink extends BaseEntity {

    @Column(name = "org_type", nullable = false, length = 32)
    private String orgType;

    @Column(name = "org_id", nullable = false)
    private Integer orgId;

    @Column(name = "uc_p_root_id", nullable = false)
    private Integer ucPRootId;

    @Column(name = "unique_value", columnDefinition = "tinyint")
    private Integer uniqueValue;

    @Column(name = "unique_field_code", length = 32)
    private String uniqueFieldCode;

    @Column(name = "linked_by", nullable = false)
    private Integer linkedBy;
}
