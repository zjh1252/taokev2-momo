package com.taoke.user.mapper;

import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.institution.InstitutionPublicResponse;
import com.taoke.user.dto.institution.InstitutionResponse;
import com.taoke.user.entity.Institution;
import org.mapstruct.Mapper;

/**
 * 机构信息对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Mapper(componentModel = "spring")
public interface InstitutionMapper {

    InstitutionResponse toResponse(Institution institution);

    InstitutionListItemResponse toListItemResponse(Institution institution);

    InstitutionPublicResponse toPublicResponse(Institution institution);
}
