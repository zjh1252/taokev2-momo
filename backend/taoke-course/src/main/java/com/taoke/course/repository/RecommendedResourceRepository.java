package com.taoke.course.repository;

import com.taoke.course.entity.cms.RecommendedResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 推荐资源位 Repository
 *
 * @author Fangxinxin
 * @date 2026-06-12 18:00
 */
public interface RecommendedResourceRepository extends JpaRepository<RecommendedResource, Integer> {

    List<RecommendedResource> findBySlotCodeAndCategoryIdOrderBySortOrderDescIdDesc(
            String slotCode, Integer categoryId);

    List<RecommendedResource> findBySlotCodeAndCategoryIdIsNullOrderBySortOrderDescIdDesc(String slotCode);

    Optional<RecommendedResource> findBySlotCodeAndResourceTypeAndResourceIdAndCategoryIdAndRoleType(
            String slotCode, String resourceType, Integer resourceId, Integer categoryId, String roleType);

    boolean existsBySlotCodeAndResourceTypeAndResourceIdAndCategoryIdAndRoleType(
            String slotCode, String resourceType, Integer resourceId, Integer categoryId, String roleType);

    boolean existsBySlotCodeAndResourceTypeAndResourceId(
            String slotCode, String resourceType, Integer resourceId);

    boolean existsBySlotCodeInAndResourceTypeAndResourceId(
            java.util.Collection<String> slotCodes, String resourceType, Integer resourceId);
}
