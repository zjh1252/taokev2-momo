package com.taoke.admin.service;

import com.taoke.admin.dto.PermissionVO;
import com.taoke.admin.dto.SavePermissionRequest;
import com.taoke.user.api.PermissionService;
import com.taoke.user.entity.Permission;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 后台 — 权限管理编排服务（薄层）。
 * <p>
 * 领域操作委托给 {@link PermissionService}，仅处理 VO 映射与树形组装。
 */
@Service
@RequiredArgsConstructor
public class AdminPermissionService {

    private final PermissionService permissionService;

    /**
     * 获取权限树（按 parentId 组装成树形结构）
     */
    public List<PermissionVO> getPermissionTree() {
        List<Permission> all = permissionService.findAllOrdered();
        List<PermissionVO> voList = all.stream().map(this::toVO).toList();

        Map<Integer, List<PermissionVO>> childrenMap = voList.stream()
                .filter(v -> v.getParentId() != 0)
                .collect(Collectors.groupingBy(PermissionVO::getParentId));

        voList.forEach(v -> v.setChildren(childrenMap.getOrDefault(v.getId(), new ArrayList<>())));

        return voList.stream()
                .filter(v -> v.getParentId() == 0)
                .toList();
    }

    /**
     * 获取所有权限（平铺列表）
     */
    public List<PermissionVO> listAll() {
        return permissionService.findAllOrdered().stream()
                .map(this::toVO)
                .toList();
    }

    public PermissionVO create(SavePermissionRequest request) {
        Permission entity = new Permission();
        applyRequest(entity, request);
        return toVO(permissionService.create(entity));
    }

    public PermissionVO update(Integer id, SavePermissionRequest request) {
        Permission updated = new Permission();
        applyRequest(updated, request);
        return toVO(permissionService.update(id, updated));
    }

    public void delete(Integer id) {
        permissionService.delete(id);
    }

    /* ==================== 内部方法 ==================== */

    private void applyRequest(Permission entity, SavePermissionRequest req) {
        entity.setPermissionCode(req.getPermissionCode());
        entity.setPermissionName(req.getPermissionName());
        entity.setModule(req.getModule());
        entity.setActionType(req.getActionType());
        entity.setParentId(req.getParentId() != null ? req.getParentId() : 0);
        entity.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        entity.setDescription(req.getDescription());
    }

    private PermissionVO toVO(Permission p) {
        PermissionVO vo = new PermissionVO();
        vo.setId(p.getId());
        vo.setPermissionCode(p.getPermissionCode());
        vo.setPermissionName(p.getPermissionName());
        vo.setModule(p.getModule());
        vo.setActionType(p.getActionType());
        vo.setParentId(p.getParentId());
        vo.setSortOrder(p.getSortOrder());
        vo.setDescription(p.getDescription());
        return vo;
    }
}
