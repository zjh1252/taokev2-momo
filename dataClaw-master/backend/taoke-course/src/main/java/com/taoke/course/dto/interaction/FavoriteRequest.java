package com.taoke.course.dto.interaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 收藏/取消收藏请求体
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Data
public class FavoriteRequest {

    /** 资源类型：COURSE / TRAINER / INSTITUTION / CASE */
    @NotBlank(message = "资源类型不能为空")
    private String targetType;

    /** 资源 ID */
    @NotNull(message = "资源ID不能为空")
    private Integer targetId;
}
