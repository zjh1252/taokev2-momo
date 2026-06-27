package com.taoke.user.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.taoke.user.dto.binding.BindingItemResponse;
import com.taoke.user.dto.uc.*;
import com.taoke.user.enums.UcOrgType;

import java.util.List;

/**
 * UC 组织映射与成员 lookup 服务。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
public interface UcIntegrationService {

    UcOrgLinkResponse getOrgLink(Integer operatorUserId, UcOrgType orgType);

    UcOrgLinkResponse saveOrgLink(Integer operatorUserId, UcOrgType orgType, SaveUcOrgLinkRequest request);

    void deleteOrgLink(Integer operatorUserId, UcOrgType orgType);

    UcIdentityFieldResponse getIdentityField(Integer operatorUserId, UcOrgType orgType);

    UcMemberLookupResponse lookupMember(Integer operatorUserId, UcOrgType orgType, UcMemberLookupRequest request);

    JsonNode syncMemberProfile(Integer operatorUserId, UcOrgType orgType, Integer memberLinkId);

    List<UcMemberLinkItemResponse> listMemberLinks(Integer operatorUserId, UcOrgType orgType);

    void attachMemberLinkToBinding(Integer memberLinkId, Integer userId, String bindingRefType, Integer bindingRefId);

    UcMemberLinkItemResponse bindMemberToEmployeeBinding(Integer operatorUserId, UcOrgType orgType,
                                                         Integer bindingId, UcMemberLookupRequest request);

    void unbindMemberFromEmployeeBinding(Integer operatorUserId, UcOrgType orgType, Integer bindingId);

    void enrichBindingsWithUcMembers(UcOrgType orgType, Integer orgEntityId, String bindingRefType,
                                   List<BindingItemResponse> items);

    /**
     * 企业买家：记录成员关系（不经过绑定表，无单组织限制）。
     */
    UcMemberLinkItemResponse attachEnterpriseBuyerMember(Integer operatorUserId, Integer targetUserId, Integer memberLinkId);
}
