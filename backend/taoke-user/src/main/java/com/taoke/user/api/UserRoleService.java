package com.taoke.user.api;

import com.taoke.user.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 用户-角色关联查询与平台角色分配能力。
 *
 * @author Fangxinxin
 * @date 2026-04-02 21:00
 */
public interface UserRoleService {

    /**
     * 批量查询多个用户的角色列表
     *
     * @param userIds 用户 ID 列表
     * @return 角色关联列表
     */
    List<UserRole> findByUserIds(List<Integer> userIds);

    /**
     * 查询单个用户的全部角色
     *
     * @param userId 用户 ID
     * @return 角色关联列表
     */
    List<UserRole> findByUserId(Integer userId);

    /**
     * 按角色编码分页查询
     */
    Page<UserRole> findByRole(String role, Pageable pageable);

    /**
     * 按角色编码 + 状态分页查询
     */
    Page<UserRole> findByRoleAndStatus(String role, Integer status, Pageable pageable);

    /**
     * 获取某角色下指定状态的所有用户 ID（如：已生效的某业务角色用户）
     *
     * @param roleCode 角色编码
     * @param status   状态（1=生效）
     * @return 用户 ID 列表
     */
    List<Integer> getUserIdsByRoleAndStatus(String roleCode, Integer status);

    /**
     * 获取用户当前持有的平台角色列表
     *
     * @param userId 用户 ID
     * @return 该用户的平台角色关联列表
     */
    List<UserRole> getUserPlatformRoles(Integer userId);

    /**
     * 全量替换用户的平台角色（新增的直接生效，多余的移除，不影响业务角色）
     *
     * @param userId    用户 ID
     * @param roleCodes 目标平台角色编码列表
     * @return 替换后该用户持有的平台角色列表
     */
    List<UserRole> assignPlatformRoles(Integer userId, List<String> roleCodes);
}
