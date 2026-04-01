package com.taoke.admin.service;

import com.taoke.admin.dto.AssignPermissionsRequest;
import com.taoke.admin.dto.RoleVO;
import com.taoke.admin.dto.SaveRoleRequest;
import com.taoke.user.api.RoleService;
import com.taoke.user.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 后台 — 角色管理编排服务（薄层）。
 * <p>
 * 领域操作委托给 {@link RoleService}，仅处理 VO 映射。
 */
@Service
@RequiredArgsConstructor
public class AdminRoleService {

    private final RoleService roleService;

    public List<RoleVO> listAll() {
        return roleService.findAll().stream().map(this::toVO).toList();
    }

    public RoleVO getById(Integer id) {
        return toVO(roleService.getById(id));
    }

    public RoleVO create(SaveRoleRequest request) {
        Role entity = new Role();
        applyRequest(entity, request);
        entity.setIsSystem(0);
        return toVO(roleService.create(entity));
    }

    public RoleVO update(Integer id, SaveRoleRequest request) {
        Role updated = new Role();
        applyRequest(updated, request);
        return toVO(roleService.update(id, updated));
    }

    public void delete(Integer id) {
        roleService.delete(id);
    }

    public void assignPermissions(Integer roleId, AssignPermissionsRequest request) {
        roleService.assignPermissions(roleId, request.getPermissionIds());
    }

    /* ==================== 内部方法 ==================== */

    private void applyRequest(Role entity, SaveRoleRequest req) {
        entity.setRoleCode(req.getRoleCode());
        entity.setRoleName(req.getRoleName());
        entity.setDescription(req.getDescription());
        if (req.getIsActive() != null) {
            entity.setIsActive(req.getIsActive());
        }
    }

    private RoleVO toVO(Role role) {
        RoleVO vo = new RoleVO();
        vo.setId(role.getId());
        vo.setRoleCode(role.getRoleCode());
        vo.setRoleName(role.getRoleName());
        vo.setDescription(role.getDescription());
        vo.setIsSystem(role.getIsSystem());
        vo.setIsActive(role.getIsActive());
        vo.setCreatedAt(role.getCreatedAt());
        vo.setPermissionIds(roleService.getPermissionIds(role.getId()));
        return vo;
    }
}
