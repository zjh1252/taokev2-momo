package com.taoke.admin.mapper;

import com.taoke.admin.dto.AdminUserRoleItem;
import com.taoke.admin.dto.AdminUserVO;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

/**
 * 后台用户对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AdminUserMapper {

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "courseCount", ignore = true)
    @Mapping(target = "caseCount", ignore = true)
    @Mapping(target = "realNameCertStatus", ignore = true)
    AdminUserVO toVO(User user);

    AdminUserRoleItem toRoleItem(UserRole userRole);
}
