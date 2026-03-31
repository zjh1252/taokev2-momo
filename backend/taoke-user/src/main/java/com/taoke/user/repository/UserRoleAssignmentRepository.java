package com.taoke.user.repository;

import com.taoke.user.entity.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 用户与 RBAC 角色指派持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, Integer> {

    List<UserRoleAssignment> findByUserId(Integer userId);

    void deleteByUserIdAndRoleId(Integer userId, Integer roleId);
}
