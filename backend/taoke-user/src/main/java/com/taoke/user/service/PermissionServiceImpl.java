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
    public Permission create(Permission permission) {
        if (permissionRepository.existsByPermissionCode(permission.getPermissionCode())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "权限编码已存在");
        }
        return permissionRepository.save(permission);
    }

    @Override
    @Transactional
    public Permission update(Integer id, Permission updated) {
        Permission entity = getById(id);
        if (!entity.getPermissionCode().equals(updated.getPermissionCode())
                && permissionRepository.existsByPermissionCode(updated.getPermissionCode())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "权限编码已存在");
        }
        entity.setPermissionCode(updated.getPermissionCode());
        entity.setPermissionName(updated.getPermissionName());
        entity.setModule(updated.getModule());
        entity.setActionType(updated.getActionType());
        entity.setParentId(updated.getParentId());
        entity.setSortOrder(updated.getSortOrder());
        entity.setDescription(updated.getDescription());
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
