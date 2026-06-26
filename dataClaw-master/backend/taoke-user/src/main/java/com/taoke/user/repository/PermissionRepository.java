package com.taoke.user.repository;

import com.taoke.user.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;

/**
 * 权限定义及按用户解析权限编码。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
public interface PermissionRepository extends JpaRepository<Permission, Integer> {

    /**
     * 根据用户 ID 查询其所有 RBAC 权限编码（通过 user_role_assignments → role_permissions → permissions 链路）
     */
    @Query("""
            SELECT DISTINCT p.permissionCode FROM Permission p
            JOIN RolePermission rp ON rp.permissionId = p.id
            JOIN UserRoleAssignment ura ON ura.roleId = rp.roleId
            WHERE ura.userId = :userId
            """)
    Set<String> findPermissionCodesByUserId(Integer userId);

    List<Permission> findByModule(String module);

    boolean existsByPermissionCode(String permissionCode);

    List<Permission> findAllByOrderBySortOrderAsc();
}
