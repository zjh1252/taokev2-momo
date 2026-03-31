package com.taoke.user.mapper;

import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerResponse;
import com.taoke.user.entity.EnterpriseBuyer;
import org.mapstruct.Mapper;

/**
 * 企业培训采购方信息对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31
 */
@Mapper(componentModel = "spring")
public interface EnterpriseBuyerMapper {

    EnterpriseBuyerResponse toResponse(EnterpriseBuyer enterpriseBuyer);
}
