package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 机构扩展信息实体 — INSTITUTION 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "user_institutions")
public class Institution extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private Integer userId;

    /** 机构名称 */
    @Column(name = "org_name", length = 128)
    private String orgName;

    /** 机构类型：0=非高校，1=高校 */
    @Column(name = "org_type", nullable = false, columnDefinition = "tinyint")
    private Integer orgType = 0;

    /** 营业执照号 */
    @Column(name = "license_no", length = 64)
    private String licenseNo;

    /** 机构简介（支持富文本） */
    @Column(name = "bio", columnDefinition = "text")
    private String bio;

    /** 主页配置 */
    @Column(name = "homepage_config", columnDefinition = "json")
    private String homepageConfig;

    /** 联系人姓名 */
    @Column(name = "contact_name", length = 64)
    private String contactName;

    /** 联系电话 */
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    /** 是否公开联系方式：0=不公开，1=公开 */
    @Column(name = "show_contact", nullable = false, columnDefinition = "tinyint")
    private Integer showContact = 0;

    /** 公司所在邮编 */
    @Column(name = "post_code", nullable = false, length = 10)
    private String postCode = "";

    /** 公司所在省份 */
    @Column(name = "province_id", nullable = false)
    private Integer provinceId = 0;

    /** 公司所在城市 */
    @Column(name = "city_id", nullable = false)
    private Integer cityId = 0;

    /** 公司所在区县 */
    @Column(name = "district_id", nullable = false)
    private Integer districtId = 0;

    /** 公司所在乡镇 */
    @Column(name = "town_id", nullable = false)
    private Integer townId = 0;

    /** 详细地址 */
    @Column(name = "address", nullable = false, length = 200)
    private String address = "";
}
