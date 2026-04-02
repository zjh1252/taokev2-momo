package com.taoke.admin.service;

import com.taoke.admin.dto.AssignPermissionsRequest;
import com.taoke.admin.dto.RoleVO;
import com.taoke.admin.dto.SaveRoleRequest;
import com.taoke.common.enums.RoleType;
import com.taoke.user.api.RoleService;
import com.taoke.user.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 后台 — 角色管理编排服务（薄层）。
 * <p>
 * 领域操作委托给 {@link RoleService}，仅处理 VO 映射，不构造跨模块 entity。
 *
 * @author Fangxinxin
 * @date 2026-04-01
 */
@Service
@RequiredArgsConstructor
public class AdminRoleService {

    private final RoleService roleService;

    /**
     * 查询角色列表，可选按 roleType 过滤
     *
     * @param roleType 角色分类（BUSINESS / PLATFORM），null 则返回全部
     */
    public List<RoleVO> listAll(String roleType) {
        List<Role> roles = roleService.findAll();
        if (roleType != null && !roleType.isBlank()) {
            roles = roles.stream()
                    .filter(r -> roleType.equalsIgnoreCase(r.getRoleType()))
                    .toList();
        }
        return roles.stream().map(this::toVO).toList();
    }

    public RoleVO getById(Integer id) {
        return toVO(roleService.getById(id));
    }

    public RoleVO create(SaveRoleRequest request) {
        Role created = roleService.create(
                request.getRoleCode(),
                request.getRoleName(),
                RoleType.PLATFORM.name(),
                request.getDescription(),
                request.getIsActive(),
                0
        );
        return toVO(created);
    }

    public RoleVO update(Integer id, SaveRoleRequest request) {
        Role updated = roleService.update(
                id,
                request.getRoleCode(),
                request.getRoleName(),
                request.getDescription(),
                request.getIsActive()
        );
        return toVO(updated);
    }

    public void delete(Integer id) {
        roleService.delete(id);
    }

    public void assignPermissions(Integer roleId, AssignPermissionsRequest request) {
        roleService.assignPermissions(roleId, request.getPermissionIds());
    }

    /* ==================== 内部方法 ==================== */

    private RoleVO toVO(Role role) {
        RoleVO vo = new RoleVO();
        vo.setId(role.getId());
        vo.setRoleCode(role.getRoleCode());
        vo.setRoleName(role.getRoleName());
        vo.setRoleType(role.getRoleType());
        vo.setDescription(role.getDescription());
        vo.setIsSystem(role.getIsSystem());
        vo.setIsActive(role.getIsActive());
        vo.setCreatedAt(role.getCreatedAt());
        vo.setPermissionIds(roleService.getPermissionIds(role.getId()));
        return vo;
    }
}
