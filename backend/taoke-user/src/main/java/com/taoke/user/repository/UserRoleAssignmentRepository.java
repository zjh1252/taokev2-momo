package com.taoke.user.repository;

import com.taoke.user.entity.UserRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRoleAssignmentRepository extends JpaRepository<UserRoleAssignment, Integer> {

    List<UserRoleAssignment> findByUserId(Integer userId);

    void deleteByUserIdAndRoleId(Integer userId, Integer roleId);
}
