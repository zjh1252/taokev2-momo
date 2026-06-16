package com.taoke.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 设为/取消培训协会请求体。
 *
 * @author Fangxinxin
 * @date 2026-04-09 10:00
 */
@Data
public class SetAssociationRequest {

    @NotNull(message = "association 不能为空")
    private Boolean association;
}
