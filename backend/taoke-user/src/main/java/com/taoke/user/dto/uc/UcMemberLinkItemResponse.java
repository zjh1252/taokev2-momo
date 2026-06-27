package com.taoke.user.dto.uc;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * UC 成员关联列表项。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Data
@Builder
public class UcMemberLinkItemResponse {

    private Integer id;
    private Integer userId;
    private String identityValue;
    private Integer pStuId;
    private Integer syncStatus;
    private JsonNode profile;
    private String bindingRefType;
    private Integer bindingRefId;
    private LocalDateTime createdAt;
}
