package com.taoke.user.repository;

import com.taoke.user.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {

    List<UserRole> findByUserIdAndStatus(Integer userId, Integer status);

    List<UserRole> findByUserId(Integer userId);

    boolean existsByUserIdAndRole(Integer userId, String role);
}
