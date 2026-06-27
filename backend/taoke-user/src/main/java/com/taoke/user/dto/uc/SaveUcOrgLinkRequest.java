package com.taoke.user.dto.uc;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 保存 UC 组织映射请求。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Data
public class SaveUcOrgLinkRequest {

    @NotNull
    private Integer ucPRootId;
}
