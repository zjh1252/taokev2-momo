package com.taoke.user.repository;

import com.taoke.user.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    List<UserRole> findByRole(String role);

    Page<UserRole> findByRole(String role, Pageable pageable);

    Page<UserRole> findByRoleAndStatus(String role, Integer status, Pageable pageable);

    /**
     * 后台「申请列表」专用查询：
     * <ul>
     *   <li>status 为空：返回全部，待审核（status=2 或 reapplying=true）置顶，组内按 updatedAt 倒序</li>
     *   <li>status=2：返回待审核 + 资料重审中（reapplying=true）</li>
     *   <li>其它 status：按 status 精确过滤且排除重审中（重审记录归入「待审核」筛选）</li>
     * </ul>
     */
    @Query("""
            SELECT ur FROM UserRole ur
            WHERE ur.role = :role
              AND (:status IS NULL
                   OR (:status = 2 AND (ur.status = 2 OR ur.reapplying = true))
                   OR (:status <> 2 AND ur.status = :status
                       AND (ur.reapplying IS NULL OR ur.reapplying = false)))
            ORDER BY CASE WHEN ur.status = 2 OR ur.reapplying = true THEN 0 ELSE 1 END,
                     ur.updatedAt DESC
            """)
    Page<UserRole> findApplications(@Param("role") String role, @Param("status") Integer status, Pageable pageable);

    /** 待审核或资料重审中的角色申请数量 */
    @Query("""
            SELECT COUNT(ur) FROM UserRole ur
            WHERE ur.role = :role
              AND (ur.status = 2 OR ur.reapplying = true)
            """)
    long countPendingApplications(@Param("role") String role);
}
