package com.taoke.admin.service;

import com.taoke.admin.dto.PermissionVO;
import com.taoke.admin.dto.SavePermissionRequest;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.entity.Permission;
import com.taoke.user.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 后台 — 权限管理服务。
 */
@Service
@RequiredArgsConstructor
public class AdminPermissionService {

    private final PermissionRepository permissionRepository;

    /**
     * 获取权限树（按 parentId 组装成树形结构）
     */
    public List<PermissionVO> getPermissionTree() {
        List<Permission> all = permissionRepository.findAllByOrderBySortOrderAsc();
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
        return permissionRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toVO)
                .toList();
    }

    @Transactional
    public PermissionVO create(SavePermissionRequest request) {
        if (permissionRepository.existsByPermissionCode(request.getPermissionCode())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "权限编码已存在");
        }
        Permission entity = new Permission();
        applyRequest(entity, request);
        permissionRepository.save(entity);
        return toVO(entity);
    }

    @Transactional
    public PermissionVO update(Integer id, SavePermissionRequest request) {
        Permission entity = permissionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "权限不存在"));
        // 编码变更时检查唯一性
        if (!entity.getPermissionCode().equals(request.getPermissionCode())
                && permissionRepository.existsByPermissionCode(request.getPermissionCode())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "权限编码已存在");
        }
        applyRequest(entity, request);
        permissionRepository.save(entity);
        return toVO(entity);
    }

    @Transactional
    public void delete(Integer id) {
        if (!permissionRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "权限不存在");
        }
        permissionRepository.deleteById(id);
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
