package com.taoke.common.service.impl;

import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.entity.Category;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    public List<CategoryTreeVO> getFullTree(String type) {
        List<Category> all = categoryRepository.findByTypeOrderBySortOrder(type);
        return buildTree(all);
    }

    @Override
    public Category getById(Integer id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "分类不存在"));
    }

    @Override
    @Transactional
    public Category createCategory(String type, Integer parentId, String name,
                                   Integer sortOrder, Integer isVisible,
                                   String icon, String description) {
        Category entity = new Category();
        entity.setType(type);
        entity.setParentId(parentId != null ? parentId : 0);
        entity.setName(name);
        entity.setSortOrder(sortOrder != null ? sortOrder : 0);
        entity.setIsVisible(isVisible != null ? isVisible : 1);
        entity.setIcon(icon);
        entity.setDescription(description);

        if (parentId != null && parentId > 0) {
            Category parent = getById(parentId);
            entity.setLevel(parent.getLevel() + 1);
        } else {
            entity.setLevel(1);
        }

        return categoryRepository.save(entity);
    }

    @Override
    @Transactional
    public Category updateCategory(Integer id, String name, Integer sortOrder,
                                   Integer isVisible, String icon, String description) {
        Category entity = getById(id);
        if (name != null) entity.setName(name);
        if (sortOrder != null) entity.setSortOrder(sortOrder);
        if (isVisible != null) entity.setIsVisible(isVisible);
        if (icon != null) entity.setIcon(icon);
        if (description != null) entity.setDescription(description);
        return categoryRepository.save(entity);
    }

    @Override
    @Transactional
    public void deleteCategory(Integer id) {
        Category entity = getById(id);
        boolean hasChildren = categoryRepository.existsByParentId(id);
        if (hasChildren) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "该分类下存在子分类，请先删除子分类");
        }
        categoryRepository.delete(entity);
    }

    private CategoryTreeVO toVO(Category entity) {
        CategoryTreeVO vo = new CategoryTreeVO();
        vo.setId(entity.getId());
        vo.setParentId(entity.getParentId());
        vo.setName(entity.getName());
        vo.setLevel(entity.getLevel());
        vo.setSortOrder(entity.getSortOrder());
        vo.setIsVisible(entity.getIsVisible());
        vo.setIcon(entity.getIcon());
        vo.setDescription(entity.getDescription());
        return vo;
    }
}
