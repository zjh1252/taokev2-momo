package com.taoke.user.api;

import com.taoke.user.entity.Permission;
import java.util.List;

/**
 * 权限资源维护能力（查询、按模块筛选、增删改）。当前仅定义契约，具体实现待接入。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface PermissionService {

    /**
     * 查询全部权限并按约定顺序排列（如排序字段、模块分组等由实现决定）。
     *
     * @return 权限列表
     */
    List<Permission> findAllOrdered();

    /**
     * 按业务模块查询权限列表。
     *
     * @param module 模块标识
     * @return 该模块下的权限列表
     */
    List<Permission> findByModule(String module);

    /**
     * 根据主键查询权限。
     *
     * @param id 权限 ID
     * @return 权限实体；不存在时由实现约定
     */
    Permission getById(Integer id);

    /**
     * 新建权限。
     *
     * @param permissionCode 权限编码
     * @param permissionName 权限名称
     * @param module         所属模块
     * @param actionType     操作类型
     * @param parentId       父级 ID（0 为顶级）
     * @param sortOrder      排序序号
     * @param description    描述
     * @return 保存后的权限
     */
    Permission create(String permissionCode, String permissionName, String module,
                      String actionType, Integer parentId, Integer sortOrder, String description);

    /**
     * 更新指定 ID 的权限。
     *
     * @param id             权限 ID
     * @param permissionCode 权限编码
     * @param permissionName 权限名称
     * @param module         所属模块
     * @param actionType     操作类型
     * @param parentId       父级 ID
     * @param sortOrder      排序序号
     * @param description    描述
     * @return 更新后的权限
     */
    Permission update(Integer id, String permissionCode, String permissionName, String module,
                      String actionType, Integer parentId, Integer sortOrder, String description);

    /**
     * 删除指定权限。
     *
     * @param id 权限 ID
     */
    void delete(Integer id);
}
