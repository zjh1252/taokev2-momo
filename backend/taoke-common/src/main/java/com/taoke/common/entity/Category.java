package com.taoke.common.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 统一分类定义实体 — 映射 sys_categories 表
 * <p>
 * 通过 type 字段区分不同分类体系（TRAINER_EXPERTISE / TRAINER_INDUSTRY 等），
 * 使用 parent_id + level 构建树形结构。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:50
 */
@Getter
@Setter
@Entity
@Table(name = "sys_categories")
public class Category extends BaseEntity {

    /** 分类类型：TRAINER_EXPERTISE / TRAINER_INDUSTRY 等 */
    @Column(name = "type", nullable = false, length = 50)
    private String type;

    /** 父级 ID，0 表示顶级节点 */
    @Column(name = "parent_id", nullable = false)
    private Integer parentId = 0;

    /** 分类名称 */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** 层级：1=一级, 2=二级, 3=三级 */
    @Column(name = "level", nullable = false, columnDefinition = "tinyint")
    private Integer level = 1;

    /** 同级排序值 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    /** 是否可见：0=隐藏, 1=可见 */
    @Column(name = "is_visible", nullable = false, columnDefinition = "tinyint")
    private Integer isVisible = 1;

    /** 图标 URL */
    @Column(name = "icon", length = 500)
    private String icon;

    /** 描述 */
    @Column(name = "description", length = 500)
    private String description;

    /** 扩展字段（JSON） */
    @Column(name = "extra", columnDefinition = "json")
    private String extra;
}
