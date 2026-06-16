package com.taoke.user.mapper;

import com.taoke.user.dto.institutionemployee.InstitutionEmployeeResponse;
import com.taoke.user.entity.InstitutionEmployee;
import org.mapstruct.Mapper;

/**
 * 机构员工信息对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Mapper(componentModel = "spring")
public interface InstitutionEmployeeMapper {

    InstitutionEmployeeResponse toResponse(InstitutionEmployee institutionEmployee);
}
