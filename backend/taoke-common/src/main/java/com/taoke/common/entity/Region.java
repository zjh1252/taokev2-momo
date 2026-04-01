package com.taoke.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * 行政区划实体，映射 common_regions 表。
 * <p>
 * 四级结构：省（level=1）→ 市（level=2）→ 区/县（level=3）→ 街道/乡镇（level=4）。
 * 通过 parentCode 构成父子关系。
 *
 * @author Fangxinxin
 * @date 2026-04-01 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "common_regions")
public class Region extends BaseEntity {

    /** 行政区划编码（如 110000000000 表示北京市） */
    @Column(name = "code", nullable = false, columnDefinition = "CHAR(36)", unique = true)
    private String code;

    /** 地区名称 */
    @Column(name = "name", nullable = false, length = 765)
    private String name;

    /** 父级区划编码，顶级省份的 parentCode 为 "0" */
    @Column(name = "parent_code", nullable = false, columnDefinition = "CHAR(36)")
    private String parentCode;

    /** 层级：1=省/直辖市，2=市，3=区/县，4=街道/乡镇 */
    @Column(name = "level", nullable = false)
    private Integer level;
}
