package com.taoke.course.service;

import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.course.entity.OpsMaterial;
import com.taoke.course.enums.OpsMaterialScene;
import com.taoke.course.enums.OpsMaterialType;
import com.taoke.course.repository.OpsMaterialRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * 运营素材库默认素材解析实现
 *
 * @author Fangxinxin
 * @date 2026-06-15 18:00
 */
@Service
@RequiredArgsConstructor
public class OpsMaterialResolverImpl implements OpsMaterialResolver {

    private static final String FALLBACK_CATEGORY = "其它";

    private final OpsMaterialRepository materialRepository;

    @Override
    @Transactional(readOnly = true)
    public String pickDefaultMaterialUrl(String materialType, String category, String scene, int seed) {
        OpsMaterialType type = OpsMaterialType.fromCode(materialType);
        List<OpsMaterial> pool = selectPool(type, category, scene);
        if (pool.isEmpty()) {
            return null;
        }
        int index = new Random(seed).nextInt(pool.size());
        return pool.get(index).getUrl();
    }

    private List<OpsMaterial> selectPool(OpsMaterialType type, String category, String scene) {
        List<OpsMaterial> byScene = loadDefaults(type, scene);
        if (type == OpsMaterialType.AVATAR || category == null || category.isBlank()) {
            return byScene;
        }
        String trimmedCategory = category.trim();
        List<OpsMaterial> exact = byScene.stream()
                .filter(m -> trimmedCategory.equals(m.getCategory()))
                .toList();
        if (!exact.isEmpty()) {
            return exact;
        }
        List<OpsMaterial> fallback = byScene.stream()
                .filter(m -> FALLBACK_CATEGORY.equals(m.getCategory()))
                .toList();
        return fallback.isEmpty() ? byScene : fallback;
    }

    private List<OpsMaterial> loadDefaults(OpsMaterialType type, String scene) {
        OpsMaterialScene sceneEnum = OpsMaterialScene.fromCode(scene);
        Specification<OpsMaterial> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("materialType"), type.name()));
            predicates.add(cb.isTrue(root.get("enabled")));
            predicates.add(cb.isTrue(root.get("isDefault")));
            if (sceneEnum != OpsMaterialScene.GENERAL) {
                predicates.add(cb.or(
                        cb.equal(root.get("scene"), sceneEnum.name()),
                        cb.equal(root.get("scene"), OpsMaterialScene.GENERAL.name())));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return materialRepository.findAll(spec);
    }
}
