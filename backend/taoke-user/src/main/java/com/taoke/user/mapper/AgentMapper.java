package com.taoke.user.mapper;

import com.taoke.user.dto.agent.AgentResponse;
import com.taoke.user.entity.Agent;
import org.mapstruct.Mapper;

/**
 * 专家经纪人档案对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Mapper(componentModel = "spring")
public interface AgentMapper {

    AgentResponse toResponse(Agent agent);
}
