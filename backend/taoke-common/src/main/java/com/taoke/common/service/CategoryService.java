package com.taoke.common.service;

import com.taoke.common.dto.CategoryTreeVO;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 统一分类查询接口
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:50
 */
public interface CategoryService {

    /**
     * 获取指定 type 的完整分类树（仅可见节点）
     *
     * @param type 分类类型（如 TRAINER_EXPERTISE）
     * @return 树形结构的根节点列表
     */
    List<CategoryTreeVO> getTree(String type);

    /**
     * 获取指定节点的直接子级列表（仅可见）
     *
     * @param type     分类类型
     * @param parentId 父级 ID，null 查顶级
     * @return 子级列表
     */
    List<CategoryTreeVO> getChildren(String type, Integer parentId);

    /**
     * 批量获取分类名称映射，用于回填关联表的 categoryName
     *
     * @param categoryIds 分类 ID 集合
     * @return id → name 映射
     */
    Map<Integer, String> getNameMap(Collection<Integer> categoryIds);
}
