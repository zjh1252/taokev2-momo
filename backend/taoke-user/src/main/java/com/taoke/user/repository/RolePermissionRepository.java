package com.taoke.user.repository;

import com.taoke.user.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 角色与权限关联持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
public interface RolePermissionRepository extends JpaRepository<RolePermission, Integer> {

    List<RolePermission> findByRoleId(Integer roleId);

    void deleteByRoleIdAndPermissionId(Integer roleId, Integer permissionId);
}
