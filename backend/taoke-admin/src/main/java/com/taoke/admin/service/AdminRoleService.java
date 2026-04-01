package com.taoke.admin.service;

import com.taoke.admin.dto.AssignPermissionsRequest;
import com.taoke.admin.dto.RoleVO;
import com.taoke.admin.dto.SaveRoleRequest;
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
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 后台 — 角色管理服务。
 */
@Service
@RequiredArgsConstructor
public class AdminRoleService {

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;

    /**
     * 列出所有角色（含已分配权限 ID）
     */
    public List<RoleVO> listAll() {
        List<Role> roles = roleRepository.findAllByOrderByIdAsc();
        return roles.stream().map(this::toVO).toList();
    }

    public RoleVO getById(Integer id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "角色不存在"));
        return toVO(role);
    }

    @Transactional
    public RoleVO create(SaveRoleRequest request) {
        if (roleRepository.existsByRoleCode(request.getRoleCode())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "角色编码已存在");
        }
        Role entity = new Role();
        applyRequest(entity, request);
        entity.setIsSystem(0);
        roleRepository.save(entity);
        return toVO(entity);
    }

    @Transactional
    public RoleVO update(Integer id, SaveRoleRequest request) {
        Role entity = roleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "角色不存在"));
        if (!entity.getRoleCode().equals(request.getRoleCode())
                && roleRepository.existsByRoleCode(request.getRoleCode())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "角色编码已存在");
        }
        applyRequest(entity, request);
        roleRepository.save(entity);
        return toVO(entity);
    }

    @Transactional
    public void delete(Integer id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "角色不存在"));
        if (role.getIsSystem() == 1) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "系统内置角色不可删除");
        }
        rolePermissionRepository.deleteByRoleId(id);
        roleRepository.deleteById(id);
    }

    /**
     * 全量替换角色关联的权限
     */
    @Transactional
    public void assignPermissions(Integer roleId, AssignPermissionsRequest request) {
        if (!roleRepository.existsById(roleId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "角色不存在");
        }
        // 先删后增（全量替换）
        rolePermissionRepository.deleteByRoleId(roleId);

        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            List<RolePermission> rpList = request.getPermissionIds().stream()
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

        List<Integer> permIds = rolePermissionRepository.findByRoleId(role.getId())
                .stream()
                .map(RolePermission::getPermissionId)
                .toList();
        vo.setPermissionIds(permIds);
        return vo;
    }
}
