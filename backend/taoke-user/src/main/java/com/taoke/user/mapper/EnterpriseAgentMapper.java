package com.taoke.user.mapper;

import com.taoke.user.dto.enterpriseagent.EnterpriseAgentResponse;
import com.taoke.user.entity.EnterpriseAgent;
import org.mapstruct.Mapper;

/**
 * 专家经纪公司信息对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Mapper(componentModel = "spring")
public interface EnterpriseAgentMapper {

    EnterpriseAgentResponse toResponse(EnterpriseAgent enterpriseAgent);
}
