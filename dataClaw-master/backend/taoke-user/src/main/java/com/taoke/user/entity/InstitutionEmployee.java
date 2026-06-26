package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 机构员工扩展信息实体 — INSTITUTION_EMPLOYEE 角色扩展信息。
 *
 * <p>本期表单仅采集 real_name / contact_phone / email / service_cities / 协议
 * 与 org_id；旧字段 position / department 保留为 legacy，不在新表单中暴露。</p>
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

    /** 真实姓名 */
    @Column(name = "real_name", length = 64)
    private String realName;

    /** 联系电话 */
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    /** 常用邮箱 */
    @Column(name = "email", length = 128)
    private String email;

    /** 多服务城市 JSON 字符串：[{provinceId,cityId,provinceName,cityName}] */
    @Column(name = "service_cities", columnDefinition = "json")
    private String serviceCities;

    /** 注册培训机构员工合作协议签署时间 */
    @Column(name = "agreement_signed_at")
    private LocalDateTime agreementSignedAt;

    /** 协议版本号，默认 v1 */
    @Column(name = "agreement_version", length = 32)
    private String agreementVersion;

    /** 职位（legacy，新表单不再采集） */
    @Column(name = "position", length = 64)
    private String position;

    /** 部门（legacy，新表单不再采集） */
    @Column(name = "department", length = 64)
    private String department;
}
