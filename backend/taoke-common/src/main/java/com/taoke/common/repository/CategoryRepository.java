package com.taoke.common.repository;

import com.taoke.common.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * 统一分类定义持久化
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:50
 */
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    /** 按 type 查全量（用于内存组装树） */
    List<Category> findByTypeAndIsVisibleOrderBySortOrder(String type, Integer isVisible);

    /** 按 type 查全量（包含隐藏的） */
    List<Category> findByTypeOrderBySortOrder(String type);

    /** 查某节点的子级 */
    List<Category> findByTypeAndParentIdAndIsVisibleOrderBySortOrder(String type, Integer parentId, Integer isVisible);

    /** 按 ID 批量查（用于回填分类名称） */
    List<Category> findByIdIn(Collection<Integer> ids);

    /** 判断是否存在子分类 */
    boolean existsByParentId(Integer parentId);
}
