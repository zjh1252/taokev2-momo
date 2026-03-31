package com.taoke.user.mapper;

import com.taoke.user.dto.user.UserProfileResponse;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * 用户对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "hasPassword", ignore = true)
    @Mapping(target = "roles", ignore = true)
    UserProfileResponse toProfileResponse(User user);

    UserProfileResponse.RoleInfo toRoleInfo(UserRole userRole);
}
