package com.taoke.user.mapper;

import com.taoke.user.dto.trainer.TrainerResponse;
import com.taoke.user.entity.Trainer;
import org.mapstruct.Mapper;

/**
 * 专家档案对象映射。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Mapper(componentModel = "spring")
public interface TrainerMapper {

    TrainerResponse toResponse(Trainer trainer);
}
