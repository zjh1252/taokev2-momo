package com.taoke.user.repository;

import com.taoke.user.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, Integer> {

    List<RolePermission> findByRoleId(Integer roleId);

    void deleteByRoleIdAndPermissionId(Integer roleId, Integer permissionId);
}
