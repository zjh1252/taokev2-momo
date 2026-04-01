package com.taoke.user.api;

import com.taoke.user.entity.Role;
import java.util.List;

/**
 * 角色与角色-权限关联维护能力（查询、增删改、分配权限）。当前仅定义契约，具体实现待接入。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface RoleService {

    /**
     * 查询全部角色。
     *
     * @return 角色列表
     */
    List<Role> findAll();

    /**
     * 根据主键查询角色。
     *
     * @param id 角色 ID
     * @return 角色实体；不存在时由实现约定
     */
    Role getById(Integer id);

    /**
     * 判断指定 ID 的角色是否存在。
     *
     * @param id 角色 ID
     * @return 存在为 {@code true}，否则为 {@code false}
     */
    boolean existsById(Integer id);

    /**
     * 新建角色。
     *
     * @param role 待持久化的角色
     * @return 保存后的角色（含生成的主键等）
     */
    Role create(Role role);

    /**
     * 更新指定 ID 的角色。
     *
     * @param id   角色 ID
     * @param role 更新内容
     * @return 更新后的角色
     */
    Role update(Integer id, Role role);

    /**
     * 删除指定角色。
     *
     * @param id 角色 ID
     */
    void delete(Integer id);

    /**
     * 查询角色已绑定的权限 ID 列表。
     *
     * @param roleId 角色 ID
     * @return 权限 ID 列表
     */
    List<Integer> getPermissionIds(Integer roleId);

    /**
     * 为角色重新分配权限（全量覆盖语义由实现约定）。
     *
     * @param roleId         角色 ID
     * @param permissionIds  权限 ID 列表
     */
    void assignPermissions(Integer roleId, List<Integer> permissionIds);
}
