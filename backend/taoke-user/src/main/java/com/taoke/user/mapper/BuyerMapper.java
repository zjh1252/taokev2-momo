package com.taoke.user.mapper;

import com.taoke.user.dto.buyer.BuyerResponse;
import com.taoke.user.entity.Buyer;
import org.mapstruct.Mapper;

/**
 * 学员档案对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31
 */
@Mapper(componentModel = "spring")
public interface BuyerMapper {

    BuyerResponse toResponse(Buyer buyer);
}
