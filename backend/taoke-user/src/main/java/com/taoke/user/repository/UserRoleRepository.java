package com.taoke.user.repository;

import com.taoke.user.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

/**
 * 用户业务角色关联持久化。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
public interface UserRoleRepository extends JpaRepository<UserRole, Integer>, JpaSpecificationExecutor<UserRole> {

    List<UserRole> findByUserIdAndStatus(Integer userId, Integer status);

    List<UserRole> findByUserId(Integer userId);

    boolean existsByUserIdAndRole(Integer userId, String role);

    boolean existsByUserIdAndRoleAndStatus(Integer userId, String role, Integer status);

    Optional<UserRole> findByUserIdAndRole(Integer userId, String role);

    List<UserRole> findByUserIdIn(List<Integer> userIds);

    Page<UserRole> findByRole(String role, Pageable pageable);

    Page<UserRole> findByRoleAndStatus(String role, Integer status, Pageable pageable);
}
