package com.taoke.user.repository;

import com.taoke.user.entity.RoleApplicationChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 角色申请变更日志 Repository。
 *
 * @author Fangxinxin
 * @date 2026-06-25 18:00
 */
@Repository
public interface RoleApplicationChangeLogRepository extends JpaRepository<RoleApplicationChangeLog, Integer> {

    List<RoleApplicationChangeLog> findByUserIdAndRoleOrderByCreatedAtDesc(Integer userId, String role);

    List<RoleApplicationChangeLog> findByUserIdAndRoleAndChangeBatch(Integer userId, String role, String changeBatch);

    Optional<RoleApplicationChangeLog> findFirstByUserIdAndRoleOrderByCreatedAtDesc(Integer userId, String role);

    void deleteByUserId(Integer userId);
}
