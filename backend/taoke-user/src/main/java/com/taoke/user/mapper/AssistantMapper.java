package com.taoke.user.mapper;

import com.taoke.user.dto.assistant.AssistantResponse;
import com.taoke.user.entity.Assistant;
import org.mapstruct.Mapper;

/**
 * 专家助理档案对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Mapper(componentModel = "spring")
public interface AssistantMapper {

    AssistantResponse toResponse(Assistant assistant);
}
