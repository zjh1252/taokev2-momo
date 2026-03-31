package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 机构员工扩展信息实体 — INSTITUTION_EMPLOYEE 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_institution_employees")
public class InstitutionEmployee extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    /** 所属机构 ID */
    @Column(name = "org_id", nullable = false)
    private Integer orgId;

    /** 职位 */
    @Column(name = "position", length = 64)
    private String position;

    /** 部门 */
    @Column(name = "department", length = 64)
    private String department;
}
