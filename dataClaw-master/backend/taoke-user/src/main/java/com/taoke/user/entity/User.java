package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 用户基础实体，全角色通用。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Getter
@Setter
@Entity
@Table(name = "sys_users")
public class User extends BaseEntity {

    /** 登录账号（字母/数字/下划线，4-32 位，与手机号二选一） */
    @Column(name = "username", length = 32, unique = true)
    private String username;

    @Column(name = "phone", length = 20, unique = true)
    private String phone;

    @Column(name = "email", length = 128, unique = true)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "nickname", length = 64)
    private String nickname;

    @Column(name = "real_name", length = 64)
    private String realName;

    @Column(name = "avatar_url", length = 512)
    private String avatarUrl;

    /** 学习标签（个人学员，逗号分隔关键词） */
    @Column(name = "study_tags", length = 500)
    private String studyTags;

    @Column(name = "gender", nullable = false, columnDefinition = "tinyint")
    private Integer gender = 0;

    @Column(name = "post_code", nullable = false, length = 10)
    private String postCode = "";

    @Column(name = "province_id", nullable = false)
    private Integer provinceId = 0;

    @Column(name = "city_id", nullable = false)
    private Integer cityId = 0;

    @Column(name = "district_id", nullable = false)
    private Integer districtId = 0;

    @Column(name = "town_id", nullable = false)
    private Integer townId = 0;

    @Column(name = "address", nullable = false, length = 200)
    private String address = "";

    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 1;

    @Column(name = "freeze_reason", length = 255)
    private String freezeReason;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    @Column(name = "reg_origin", nullable = false, columnDefinition = "tinyint")
    private Integer regOrigin = 1;
}
