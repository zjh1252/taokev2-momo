package com.taoke.user.dto.uc;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

/**
 * UC 成员 lookup 响应。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Data
@Builder
public class UcMemberLookupResponse {

    /** 是否在 UC 命中成员 */
    private boolean matched;

    /** 关联记录 ID（无论是否命中都会创建/更新草稿） */
    private Integer memberLinkId;

    private Integer pStuId;

    /** 命中时的 UC 成员摘要（userList 首条） */
    private JsonNode preview;

    /** 未命中时的提示 */
    private String message;
}
