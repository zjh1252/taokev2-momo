package com.taoke.user.dto.uc;

import lombok.Builder;
import lombok.Data;

/**
 * UC 组织映射响应。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Data
@Builder
public class UcOrgLinkResponse {

    private Integer id;
    private String orgType;
    private Integer orgId;
    private Integer ucPRootId;
    private Integer uniqueValue;
    private String uniqueFieldCode;
    private String uniqueFieldLabel;
}
