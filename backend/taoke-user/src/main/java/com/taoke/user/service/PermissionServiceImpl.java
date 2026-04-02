package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.entity.Permission;
import com.taoke.user.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 权限领域服务 — 封装权限节点的 CRUD 与业务规则。
 *
 * @author Fangxinxin
 * @date 2026-04-01
 */
@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements com.taoke.user.api.PermissionService {

    private final PermissionRepository permissionRepository;

    @Override
    public List<Permission> findAllOrdered() {
        return permissionRepository.findAllByOrderBySortOrderAsc();
    }

    @Override
    public List<Permission> findByModule(String module) {
        return permissionRepository.findByModule(module);
    }

    @Override
    public Permission getById(Integer id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "权限不存在"));
    }

    @Override
    @Transactional
    public Permission create(String permissionCode, String permissionName, String module,
                             String actionType, Integer parentId, Integer sortOrder, String description) {
        if (permissionRepository.existsByPermissionCode(permissionCode)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "权限编码已存在");
        }
        Permission entity = new Permission();
        entity.setPermissionCode(permissionCode);
        entity.setPermissionName(permissionName);
        entity.setModule(module);
        entity.setActionType(actionType);
        entity.setParentId(parentId != null ? parentId : 0);
        entity.setSortOrder(sortOrder != null ? sortOrder : 0);
        entity.setDescription(description);
        return permissionRepository.save(entity);
    }

    @Override
    @Transactional
    public Permission update(Integer id, String permissionCode, String permissionName, String module,
                             String actionType, Integer parentId, Integer sortOrder, String description) {
        Permission entity = getById(id);
        if (!entity.getPermissionCode().equals(permissionCode)
                && permissionRepository.existsByPermissionCode(permissionCode)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "权限编码已存在");
        }
        entity.setPermissionCode(permissionCode);
        entity.setPermissionName(permissionName);
        entity.setModule(module);
        entity.setActionType(actionType);
        entity.setParentId(parentId != null ? parentId : 0);
        entity.setSortOrder(sortOrder != null ? sortOrder : 0);
        entity.setDescription(description);
        return permissionRepository.save(entity);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        if (!permissionRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "权限不存在");
        }
        permissionRepository.deleteById(id);
    }
}
