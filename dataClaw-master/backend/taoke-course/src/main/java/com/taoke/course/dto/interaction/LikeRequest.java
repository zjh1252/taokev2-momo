package com.taoke.course.dto.interaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 点赞/取消点赞请求体
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Data
public class LikeRequest {

    @NotBlank(message = "资源类型不能为空")
    private String targetType;

    @NotNull(message = "资源ID不能为空")
    private Integer targetId;
}
