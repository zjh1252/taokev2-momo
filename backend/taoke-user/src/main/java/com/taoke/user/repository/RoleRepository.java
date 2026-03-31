package com.taoke.user.repository;

import com.taoke.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * RBAC 角色定义持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByRoleCode(String roleCode);
}
