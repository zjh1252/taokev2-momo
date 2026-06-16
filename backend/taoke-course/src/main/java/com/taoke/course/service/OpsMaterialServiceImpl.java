package com.taoke.course.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.api.OpsMaterialService;
import com.taoke.course.entity.OpsMaterial;
import com.taoke.course.enums.OpsMaterialScene;
import com.taoke.course.enums.OpsMaterialType;
import com.taoke.course.repository.OpsMaterialRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 运营素材库实现
 *
 * @author Fangxinxin
 * @date 2026-06-12 16:00
 */
@Service
@RequiredArgsConstructor
public class OpsMaterialServiceImpl implements OpsMaterialService {

    private final OpsMaterialRepository materialRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<OpsMaterial> listForAdmin(String materialType, String keyword, String category,
                                          String scene, Boolean enabled, Boolean isDefault,
                                          Pageable pageable) {
        return materialRepository.findAll(buildSpec(materialType, keyword, category, scene,
                enabled, isDefault, true), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OpsMaterial> listForUser(String materialType, String category, String scene,
                                         Pageable pageable) {
        return materialRepository.findAll(buildSpec(materialType, null, category, scene,
                true, null, false), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public OpsMaterial getById(Integer id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "素材不存在"));
    }

    @Override
    @Transactional
    public OpsMaterial create(String materialType, String name, String url, String category,
                              String scene, Boolean enabled, Boolean isDefault) {
        validateUrl(url);
        validateName(name);
        OpsMaterialType type = OpsMaterialType.fromCode(materialType);
        OpsMaterialScene sceneEnum = resolveScene(type, scene);

        OpsMaterial m = new OpsMaterial();
        m.setMaterialType(type.name());
        m.setName(trimName(name));
        m.setUrl(url.trim());
        m.setCategory(normalizeCategory(type, category));
        m.setScene(sceneEnum.name());
        m.setEnabled(enabled == null || enabled);
        m.setIsDefault(Boolean.TRUE.equals(isDefault));
        m.setUsageCount(0);
        return materialRepository.save(m);
    }

    @Override
    @Transactional
    public OpsMaterial update(Integer id, String name, String url, String category,
                              String scene, Boolean enabled, Boolean isDefault) {
        OpsMaterial m = getById(id);
        OpsMaterialType type = OpsMaterialType.fromCode(m.getMaterialType());

        if (name != null) {
            validateName(name);
            m.setName(trimName(name));
        }
        if (url != null) {
            validateUrl(url);
            m.setUrl(url.trim());
        }
        if (category != null) {
            m.setCategory(normalizeCategory(type, category));
        }
        if (scene != null) {
            m.setScene(resolveScene(type, scene).name());
        }
        if (enabled != null) {
            m.setEnabled(enabled);
        }
        if (isDefault != null) {
            m.setIsDefault(isDefault);
        }
        return materialRepository.save(m);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        if (!materialRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "素材不存在");
        }
        materialRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void setEnabled(Integer id, boolean enabled) {
        OpsMaterial m = getById(id);
        m.setEnabled(enabled);
        materialRepository.save(m);
    }

    @Override
    @Transactional
    public void setDefault(Integer id, boolean isDefault) {
        OpsMaterial m = getById(id);
        m.setIsDefault(isDefault);
        materialRepository.save(m);
    }

    @Override
    @Transactional
    public void batchOperate(List<Integer> ids, String action) {
        if (ids == null || ids.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请选择素材");
        }
        String op = action == null ? "" : action.trim().toUpperCase();
        List<OpsMaterial> materials = materialRepository.findAllById(ids);
        if (materials.size() != ids.size()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "部分素材不存在");
        }
        switch (op) {
            case "DELETE" -> materialRepository.deleteAllById(ids);
            case "ENABLE" -> materials.forEach(m -> m.setEnabled(true));
            case "DISABLE" -> materials.forEach(m -> m.setEnabled(false));
            case "SET_DEFAULT" -> materials.forEach(m -> m.setIsDefault(true));
            case "UNSET_DEFAULT" -> materials.forEach(m -> m.setIsDefault(false));
            default -> throw new BusinessException(ErrorCode.PARAM_INVALID, "不支持的批量操作");
        }
        if (!"DELETE".equals(op)) {
            materialRepository.saveAll(materials);
        }
    }

    @Override
    @Transactional
    public void incrementUsage(Integer id) {
        OpsMaterial m = getById(id);
        if (!Boolean.TRUE.equals(m.getEnabled())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "素材已禁用");
        }
        m.setUsageCount(m.getUsageCount() + 1);
        materialRepository.save(m);
    }

    private Specification<OpsMaterial> buildSpec(String materialType, String keyword,
                                                 String category, String scene,
                                                 Boolean enabled, Boolean isDefault,
                                                 boolean admin) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (materialType != null && !materialType.isBlank()) {
                predicates.add(cb.equal(root.get("materialType"),
                        OpsMaterialType.fromCode(materialType).name()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim() + "%";
                predicates.add(cb.like(root.get("name"), pattern));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(root.get("category"), category.trim()));
            }
            if (scene != null && !scene.isBlank()) {
                OpsMaterialScene sceneEnum = OpsMaterialScene.fromCode(scene);
                if (sceneEnum == OpsMaterialScene.GENERAL) {
                    predicates.add(cb.equal(root.get("scene"), sceneEnum.name()));
                } else {
                    predicates.add(cb.or(
                            cb.equal(root.get("scene"), sceneEnum.name()),
                            cb.equal(root.get("scene"), OpsMaterialScene.GENERAL.name())));
                }
            }
            if (enabled != null) {
                predicates.add(cb.equal(root.get("enabled"), enabled));
            }
            if (isDefault != null) {
                predicates.add(cb.equal(root.get("isDefault"), isDefault));
            }
            if (!admin) {
                predicates.add(cb.isTrue(root.get("enabled")));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "素材 URL 不能为空");
        }
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请输入 1-50 字符的素材名称");
        }
        if (name.trim().length() > 50) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请输入 1-50 字符的素材名称");
        }
    }

    private String trimName(String name) {
        return name == null ? "" : name.trim();
    }

    private String normalizeCategory(OpsMaterialType type, String category) {
        if (type == OpsMaterialType.AVATAR) {
            return "";
        }
        return category == null || category.isBlank() ? "其它" : category.trim();
    }

    private OpsMaterialScene resolveScene(OpsMaterialType type, String scene) {
        OpsMaterialScene sceneEnum = OpsMaterialScene.fromCode(scene);
        if (type == OpsMaterialType.AVATAR) {
            if (sceneEnum != OpsMaterialScene.TRAINER && sceneEnum != OpsMaterialScene.INSTITUTION) {
                return OpsMaterialScene.TRAINER;
            }
            return sceneEnum;
        }
        if (sceneEnum == OpsMaterialScene.TRAINER || sceneEnum == OpsMaterialScene.INSTITUTION) {
            return OpsMaterialScene.GENERAL;
        }
        return sceneEnum;
    }
}
