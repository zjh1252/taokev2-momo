package com.taoke.user.mapper;

import com.taoke.user.dto.enterprise.EnterpriseInfoResponse;
import com.taoke.user.entity.Enterprise;
import org.mapstruct.Mapper;

/**
 * 企业信息对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31
 */
@Mapper(componentModel = "spring")
public interface EnterpriseMapper {

    EnterpriseInfoResponse toResponse(Enterprise enterprise);
}
