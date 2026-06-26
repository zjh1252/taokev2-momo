package com.taoke.user.dto.uc;

import lombok.Builder;
import lombok.Data;

/**
 * 绑定列表上附带的 UC 成员摘要。
 *
 * @author Fangxinxin
 * @date 2026-06-26 16:00
 */
@Data
@Builder
public class UcMemberBriefResponse {

    private Integer memberLinkId;
    private Integer pStuId;
    private String identityValue;
    private Boolean profileSynced;
}
