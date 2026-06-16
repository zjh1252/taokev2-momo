package com.taoke.admin.mapper;

import com.taoke.admin.dto.AdminUserVO;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * 后台用户对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Mapper(componentModel = "spring")
public interface AdminUserMapper {

    @Mapping(target = "roles", ignore = true)
    AdminUserVO toVO(User user);

    AdminUserVO.RoleItem toRoleItem(UserRole userRole);
}
