package com.taoke.user.service;

import com.taoke.common.enums.RoleType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.entity.Role;
import com.taoke.user.entity.UserRole;
import com.taoke.user.repository.RoleRepository;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 用户-角色关联领域服务 — 查询、平台角色分配。
 *
 * @author Fangxinxin
 * @date 2026-04-02 21:00
 */
@Service
@RequiredArgsConstructor
public class UserRoleServiceImpl implements UserRoleService {

    private final UserRoleRepository userRoleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public List<UserRole> findByUserIds(List<Integer> userIds) {
        return userRoleRepository.findByUserIdIn(userIds);
    }

    @Override
    public List<UserRole> findByUserId(Integer userId) {
        return userRoleRepository.findByUserId(userId);
    }

    @Override
    public Page<UserRole> findByRole(String role, Pageable pageable) {
        return userRoleRepository.findByRole(role, pageable);
    }

    @Override
    public Page<UserRole> findByRoleAndStatus(String role, Integer status, Pageable pageable) {
        return userRoleRepository.findByRoleAndStatus(role, status, pageable);
    }

    @Override
    public List<Integer> getUserIdsByRoleAndStatus(String roleCode, Integer status) {
        return userRoleRepository
                .findByRoleAndStatus(roleCode, status, Pageable.unpaged())
                .getContent().stream()
                .map(UserRole::getUserId)
                .toList();
    }

    @Override
    public List<UserRole> getUserPlatformRoles(Integer userId) {
        Set<String> platformCodes = getPlatformRoleCodes();
        return userRoleRepository.findByUserId(userId).stream()
                .filter(ur -> platformCodes.contains(ur.getRole()))
                .toList();
    }

    @Override
    @Transactional
    public List<UserRole> assignPlatformRoles(Integer userId, List<String> roleCodes) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");
        }

        Set<String> platformCodes = getPlatformRoleCodes();

        List<String> targetCodes = roleCodes.stream().distinct().toList();
        for (String code : targetCodes) {
            if (!platformCodes.contains(code)) {
                throw new BusinessException(ErrorCode.PARAM_INVALID,
                        "仅允许分配平台管理角色，无效编码：" + code);
            }
        }

        List<UserRole> existingPlatformRoles = userRoleRepository.findByUserId(userId).stream()
                .filter(ur -> platformCodes.contains(ur.getRole()))
                .toList();

        Set<String> existingCodes = existingPlatformRoles.stream()
                .map(UserRole::getRole)
                .collect(Collectors.toSet());
        Set<String> targetSet = new HashSet<>(targetCodes);

        List<UserRole> toRemove = existingPlatformRoles.stream()
                .filter(ur -> !targetSet.contains(ur.getRole()))
                .toList();
        if (!toRemove.isEmpty()) {
            userRoleRepository.deleteAll(toRemove);
        }

        List<UserRole> toAdd = targetCodes.stream()
                .filter(code -> !existingCodes.contains(code))
                .map(code -> {
                    UserRole ur = new UserRole();
                    ur.setUserId(userId);
                    ur.setRole(code);
                    ur.setStatus(1);
                    return ur;
                })
                .toList();
        if (!toAdd.isEmpty()) {
            userRoleRepository.saveAll(toAdd);
        }

        return userRoleRepository.findByUserId(userId).stream()
                .filter(ur -> platformCodes.contains(ur.getRole()))
                .toList();
    }

    private Set<String> getPlatformRoleCodes() {
        return roleRepository.findByRoleType(RoleType.PLATFORM.name()).stream()
                .map(Role::getRoleCode)
                .collect(Collectors.toSet());
    }
}
