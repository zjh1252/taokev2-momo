package com.taoke.user.dto.uc;

import lombok.Builder;
import lombok.Data;

/**
 * UC 租户身份标识字段（供绑员工 UI 动态文案）。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Data
@Builder
public class UcIdentityFieldResponse {

    private Integer uniqueValue;
    private String fieldCode;
    private String fieldLabel;
    private String placeholder;
}
