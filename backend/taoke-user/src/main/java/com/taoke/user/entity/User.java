package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 用户基础实体 — 全角色通用
 */
@Getter
@Setter
@Entity
@Table(name = "sys_users")
public class User extends BaseEntity {

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

    @Column(name = "gender", nullable = false)
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

    @Column(name = "status", nullable = false)
    private Integer status = 1;

    @Column(name = "freeze_reason", length = 255)
    private String freezeReason;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    @Column(name = "reg_origin", nullable = false)
    private Integer regOrigin = 1;
}
