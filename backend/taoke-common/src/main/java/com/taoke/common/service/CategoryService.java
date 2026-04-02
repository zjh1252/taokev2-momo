package com.taoke.common.service;

import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.entity.Category;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 统一分类服务接口（查询 + CRUD）
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
     * 获取指定 type 的完整分类树（包含隐藏节点，后台管理使用）
     *
     * @param type 分类类型
     * @return 树形结构的根节点列表
     */
    List<CategoryTreeVO> getFullTree(String type);

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

    /**
     * 根据 ID 获取分类实体
     *
     * @param id 分类 ID
     * @return 分类实体
     */
    Category getById(Integer id);

    /**
     * 新增分类节点
     */
    Category createCategory(String type, Integer parentId, String name,
                            Integer sortOrder, Integer isVisible,
                            String icon, String description);

    /**
     * 编辑分类节点
     */
    Category updateCategory(Integer id, String name, Integer sortOrder,
                            Integer isVisible, String icon, String description);

    /**
     * 删除分类节点（仅校验无子级）
     *
     * @param id 分类 ID
     */
    void deleteCategory(Integer id);
}
