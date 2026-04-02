package com.taoke.common.dto;

import lombok.Data;

import java.util.List;

/**
 * 分类树节点 VO — 递归结构，用于前端树形展示
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:50
 */
@Data
public class CategoryTreeVO {

    private Integer id;

    private Integer parentId;

    private String name;

    private Integer level;

    private Integer sortOrder;

    private Integer isVisible;

    private String icon;

    private String description;

    /** 子节点列表，叶子节点为 null 或空列表 */
    private List<CategoryTreeVO> children;
}
