package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.entity.Role;
import com.taoke.user.entity.RolePermission;
import com.taoke.user.repository.RolePermissionRepository;
import com.taoke.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 角色领域服务 — 封装角色的 CRUD、权限分配与业务规则。
 *
 * @author Fangxinxin
 * @date 2026-04-01
 */
@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements com.taoke.user.api.RoleService {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    public List<Role> findAll() {
        return roleRepository.findAllByOrderByIdAsc();
    }

    @Override
    public Role getById(Integer id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "角色不存在"));
    }

    @Override
    public boolean existsById(Integer id) {
        return roleRepository.existsById(id);
    }

    @Override
    @Transactional
    public Role create(String roleCode, String roleName, String roleType,
                       String description, Integer isActive, Integer isSystem) {
        if (roleRepository.existsByRoleCode(roleCode)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "角色编码已存在");
        }
        Role entity = new Role();
        entity.setRoleCode(roleCode);
        entity.setRoleName(roleName);
        entity.setRoleType(roleType);
        entity.setDescription(description);
        entity.setIsActive(isActive != null ? isActive : 1);
        entity.setIsSystem(isSystem != null ? isSystem : 0);
        return roleRepository.save(entity);
    }

    @Override
    @Transactional
    public Role update(Integer id, String roleCode, String roleName,
                       String description, Integer isActive) {
        Role entity = getById(id);
        if (!entity.getRoleCode().equals(roleCode)
                && roleRepository.existsByRoleCode(roleCode)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "角色编码已存在");
        }
        entity.setRoleCode(roleCode);
        entity.setRoleName(roleName);
        entity.setDescription(description);
        if (isActive != null) {
            entity.setIsActive(isActive);
        }
        return roleRepository.save(entity);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        Role role = getById(id);
        if (role.getIsSystem() == 1) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "系统内置角色不可删除");
        }
        rolePermissionRepository.deleteByRoleId(id);
        roleRepository.deleteById(id);
    }

    @Override
    public List<Integer> getPermissionIds(Integer roleId) {
        return rolePermissionRepository.findByRoleId(roleId)
                .stream()
                .map(RolePermission::getPermissionId)
                .toList();
    }

    @Override
    public List<Role> findByRoleType(String roleType) {
        return roleRepository.findByRoleType(roleType);
    }

    @Override
    @Transactional
    public void assignPermissions(Integer roleId, List<Integer> permissionIds) {
        if (!roleRepository.existsById(roleId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "角色不存在");
        }
        rolePermissionRepository.deleteByRoleId(roleId);

        if (permissionIds != null && !permissionIds.isEmpty()) {
            List<RolePermission> rpList = permissionIds.stream()
                    .distinct()
                    .map(pid -> {
                        RolePermission rp = new RolePermission();
                        rp.setRoleId(roleId);
                        rp.setPermissionId(pid);
                        return rp;
                    })
                    .toList();
            rolePermissionRepository.saveAll(rpList);
        }
    }
}
