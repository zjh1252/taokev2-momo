package com.taoke.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 接入商用户映射（对齐老站 member_provider 表）。
 */
@Getter
@Setter
@Entity
@Table(name = "member_provider")
public class MemberProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "tkw_id", nullable = false)
    private Integer tkwId;

    @Column(name = "tkw_type", nullable = false, length = 32)
    private String tkwType;

    @Column(name = "root_company_id", nullable = false)
    private Integer rootCompanyId;

    @Column(name = "regtime", nullable = false)
    private Integer regtime;

    @Column(name = "updatetime", nullable = false)
    private Integer updatetime;
}
