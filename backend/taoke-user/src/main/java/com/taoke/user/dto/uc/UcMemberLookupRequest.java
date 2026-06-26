package com.taoke.user.dto.uc;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * UC 成员 lookup 请求。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Data
public class UcMemberLookupRequest {

    @NotBlank
    private String identityValue;

    /** 可选：显式指定 UC 组织 ID；未关联时优先于自动解析 */
    private Integer ucPRootId;
}
