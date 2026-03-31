package com.taoke.user.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Spring Security 用户主体，承载业务角色与 RBAC 权限。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Getter
public class SecurityUser implements UserDetails {

    private final Integer userId;
    private final String phone;
    private final String passwordHash;
    private final Integer status;

    /** Layer 1: 业务角色编码集合（如 TRAINER, BUYER 等） */
    private final Set<String> businessRoles;

    /** Layer 2: RBAC 权限编码集合（如 trainer:review, course:edit 等） */
    private final Set<String> permissions;

    public SecurityUser(Integer userId, String phone, String passwordHash, Integer status,
                        Set<String> businessRoles, Set<String> permissions) {
        this.userId = userId;
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.status = status;
        this.businessRoles = businessRoles;
        this.permissions = permissions;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return permissions.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return phone;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != null && status == 1;
    }

    @Override
    public boolean isEnabled() {
        return status != null && status != 3;
    }

    public boolean isSuperAdmin() {
        return businessRoles.contains("SUPER_ADMIN");
    }

    public boolean hasBusinessRole(String role) {
        return businessRoles.contains(role);
    }

    public boolean hasPermission(String permissionCode) {
        return permissions.contains(permissionCode);
    }
}
