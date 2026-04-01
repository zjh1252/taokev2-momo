package com.taoke.common.service.impl;

import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.entity.Category;
import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 统一分类查询实现
 * <p>
 * 分类数据量小（每种 type 百级别），一次查全量后内存组装树。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:50
 */
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public List<CategoryTreeVO> getTree(String type) {
        List<Category> all = categoryRepository.findByTypeAndIsVisibleOrderBySortOrder(type, 1);
        return buildTree(all);
    }

    @Override
    public List<CategoryTreeVO> getChildren(String type, Integer parentId) {
        List<Category> children = categoryRepository
                .findByTypeAndParentIdAndIsVisibleOrderBySortOrder(type, parentId, 1);
        return children.stream().map(this::toVO).toList();
    }

    @Override
    public Map<Integer, String> getNameMap(Collection<Integer> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return categoryRepository.findByIdIn(categoryIds).stream()
                .collect(Collectors.toMap(Category::getId, Category::getName));
    }

    /**
     * 内存组装树：按 parentId 分组，从根节点（parentId=0）递归向下挂载子节点
     */
    private List<CategoryTreeVO> buildTree(List<Category> all) {
        Map<Integer, List<Category>> childrenMap = all.stream()
                .filter(c -> c.getParentId() != 0)
                .collect(Collectors.groupingBy(Category::getParentId));

        List<Category> roots = all.stream()
                .filter(c -> c.getParentId() == 0)
                .toList();

        return roots.stream()
                .map(root -> toTreeVO(root, childrenMap))
                .toList();
    }

    private CategoryTreeVO toTreeVO(Category node, Map<Integer, List<Category>> childrenMap) {
        CategoryTreeVO vo = toVO(node);
        List<Category> kids = childrenMap.get(node.getId());
        if (kids != null && !kids.isEmpty()) {
            vo.setChildren(kids.stream()
                    .map(kid -> toTreeVO(kid, childrenMap))
                    .toList());
        }
        return vo;
    }

    private CategoryTreeVO toVO(Category entity) {
        CategoryTreeVO vo = new CategoryTreeVO();
        vo.setId(entity.getId());
        vo.setName(entity.getName());
        vo.setLevel(entity.getLevel());
        vo.setSortOrder(entity.getSortOrder());
        vo.setIcon(entity.getIcon());
        return vo;
    }
}
