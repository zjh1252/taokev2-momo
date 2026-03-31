package com.taoke.user.security;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.repository.PermissionRepository;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 加载 SecurityUser（业务角色与 RBAC 权限），供 JWT 认证链使用。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Service
@RequiredArgsConstructor
public class SecurityUserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PermissionRepository permissionRepository;

    public SecurityUser loadByUserId(Integer userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        // 查询生效的业务角色（status=1）
        List<UserRole> activeRoles = userRoleRepository.findByUserIdAndStatus(userId, 1);
        Set<String> businessRoles = activeRoles.stream()
                .map(UserRole::getRole)
                .collect(Collectors.toSet());

        // SUPER_ADMIN 拥有所有权限，不需要查询权限表
        Set<String> permissions;
        if (businessRoles.contains(BusinessRole.Code.SUPER_ADMIN)) {
            permissions = Collections.emptySet();
        } else {
            permissions = permissionRepository.findPermissionCodesByUserId(userId);
        }

        return new SecurityUser(
                user.getId(),
                user.getPhone(),
                user.getPasswordHash(),
                user.getStatus(),
                businessRoles,
                permissions
        );
    }

    public SecurityUser loadByPhone(String phone) {
        User user = userRepository.findByPhone(phone).orElse(null);
        if (user == null) {
            return null;
        }
        return loadByUserId(user.getId());
    }
}
