package com.taoke.user.service.uc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.UcIntegrationService;
import com.taoke.user.dto.binding.BindingItemResponse;
import com.taoke.user.dto.binding.BindingType;
import com.taoke.user.dto.uc.*;
import com.taoke.user.entity.*;
import com.taoke.user.enums.UcMemberSyncStatus;
import com.taoke.user.enums.UcOrgType;
import com.taoke.user.repository.*;
import com.taoke.user.ucenter.UcOpenApiClient;
import com.taoke.user.ucenter.UcUniqueValueMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * UC 组织映射与成员 lookup 实现。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UcIntegrationServiceImpl implements UcIntegrationService {

    private static final String PATH_GET_UNIQUE_VALUE = "/app/Company/GetUniqueValue";
    private static final String PATH_GET_ROOT_BY_BIND_UID = "/app/Company/GetRootCompanyByBindUid";
    private static final String PATH_GET_STU_ID = "/app/Stus/GetStuIdByIdNo";
    private static final String PATH_USER_LIST = "/app/Stus/userList";

    private final UcOpenApiClient ucOpenApiClient;
    private final ObjectMapper objectMapper;
    private final UserUcOrgLinkRepository orgLinkRepository;
    private final UserUcMemberLinkRepository memberLinkRepository;
    private final InstitutionRepository institutionRepository;
    private final EnterpriseAgentRepository enterpriseAgentRepository;
    private final EnterpriseBuyerRepository enterpriseBuyerRepository;
    private final UserRepository userRepository;
    private final InstitutionEmployeeBindingRepository institutionEmployeeBindingRepository;
    private final EnterpriseAgentMemberRepository enterpriseAgentMemberRepository;

    @Override
    @Transactional(readOnly = true)
    public UcOrgLinkResponse getOrgLink(Integer operatorUserId, UcOrgType orgType) {
        OrgContext ctx = resolveOrgContext(operatorUserId, orgType);
        return orgLinkRepository.findByOrgTypeAndOrgId(orgType.getCode(), ctx.orgId())
                .map(this::toOrgLinkResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    public UcOrgLinkResponse saveOrgLink(Integer operatorUserId, UcOrgType orgType, SaveUcOrgLinkRequest request) {
        ensureOpenApiEnabled();
        OrgContext ctx = resolveOrgContext(operatorUserId, orgType);
        int ucPRootId = request.getUcPRootId();
        if (ucPRootId <= 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "UC 组织 ID 无效");
        }
        UniqueValueInfo uniqueInfo = fetchUniqueValue(ucPRootId);

        UserUcOrgLink link = orgLinkRepository.findByOrgTypeAndOrgId(orgType.getCode(), ctx.orgId())
                .orElseGet(UserUcOrgLink::new);
        Integer previousRootId = link.getUcPRootId();
        Integer previousLinkId = link.getId();
        link.setOrgType(orgType.getCode());
        link.setOrgId(ctx.orgId());
        link.setUcPRootId(ucPRootId);
        link.setUniqueValue(uniqueInfo.index());
        link.setUniqueFieldCode(uniqueInfo.fieldCode());
        link.setLinkedBy(operatorUserId);
        orgLinkRepository.save(link);
        if (previousLinkId != null && previousRootId != null && !Objects.equals(previousRootId, ucPRootId)) {
            memberLinkRepository.deleteByOrgLinkId(previousLinkId);
        }
        return toOrgLinkResponse(link);
    }

    @Override
    @Transactional
    public void deleteOrgLink(Integer operatorUserId, UcOrgType orgType) {
        OrgContext ctx = resolveOrgContext(operatorUserId, orgType);
        UserUcOrgLink link = orgLinkRepository.findByOrgTypeAndOrgId(orgType.getCode(), ctx.orgId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "尚未关联 UC 组织"));
        memberLinkRepository.deleteByOrgLinkId(link.getId());
        orgLinkRepository.delete(link);
    }

    @Override
    @Transactional
    public UcIdentityFieldResponse getIdentityField(Integer operatorUserId, UcOrgType orgType) {
        UserUcOrgLink link = ensureOrgLink(operatorUserId, orgType, null);
        return buildIdentityField(link.getUniqueValue(), link.getUniqueFieldCode());
    }

    @Override
    @Transactional
    public UcMemberLookupResponse lookupMember(Integer operatorUserId, UcOrgType orgType, UcMemberLookupRequest request) {
        ensureOpenApiEnabled();
        UserUcOrgLink orgLink = ensureOrgLink(operatorUserId, orgType, request.getUcPRootId());
        String identityValue = request.getIdentityValue().trim();
        if (identityValue.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "身份标识不能为空");
        }

        UserUcMemberLink memberLink = new UserUcMemberLink();
        memberLink.setOrgLinkId(orgLink.getId());
        memberLink.setIdentityValue(identityValue);
        memberLink.setSyncStatus(UcMemberSyncStatus.LOOKUP_ONLY.getCode());

        Integer pStuId = resolvePStuId(orgLink.getUcPRootId(), identityValue);
        if (pStuId == null || pStuId <= 0) {
            memberLinkRepository.save(memberLink);
            return UcMemberLookupResponse.builder()
                    .matched(false)
                    .memberLinkId(memberLink.getId())
                    .message("未在 UC 找到对应成员，可继续纯淘课侧绑定")
                    .build();
        }

        memberLink.setPStuId(pStuId);
        memberLinkRepository.save(memberLink);

        JsonNode preview = fetchMemberPreview(orgLink.getUcPRootId(), pStuId);
        return UcMemberLookupResponse.builder()
                .matched(true)
                .memberLinkId(memberLink.getId())
                .pStuId(pStuId)
                .preview(preview)
                .build();
    }

    @Override
    @Transactional
    public JsonNode syncMemberProfile(Integer operatorUserId, UcOrgType orgType, Integer memberLinkId) {
        ensureOpenApiEnabled();
        UserUcOrgLink orgLink = requireOrgLink(operatorUserId, orgType);
        UserUcMemberLink memberLink = memberLinkRepository.findByIdAndOrgLinkId(memberLinkId, orgLink.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "成员关联不存在"));
        if (memberLink.getPStuId() == null || memberLink.getPStuId() <= 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "该记录未关联 UC 成员");
        }

        JsonNode profile = fetchMemberProfile(orgLink.getUcPRootId(), memberLink.getPStuId());
        try {
            memberLink.setProfileJson(objectMapper.writeValueAsString(profile));
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "详情序列化失败");
        }
        memberLink.setSyncStatus(UcMemberSyncStatus.PROFILE_SYNCED.getCode());
        memberLinkRepository.save(memberLink);
        return profile;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UcMemberLinkItemResponse> listMemberLinks(Integer operatorUserId, UcOrgType orgType) {
        UserUcOrgLink orgLink = requireOrgLink(operatorUserId, orgType);
        return memberLinkRepository.findByOrgLinkIdOrderByCreatedAtDesc(orgLink.getId()).stream()
                .map(this::toMemberItem)
                .toList();
    }

    @Override
    @Transactional
    public void attachMemberLinkToBinding(Integer memberLinkId, Integer userId, String bindingRefType, Integer bindingRefId) {
        UserUcMemberLink memberLink = memberLinkRepository.findById(memberLinkId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "成员关联不存在"));
        memberLink.setUserId(userId);
        memberLink.setBindingRefType(bindingRefType);
        memberLink.setBindingRefId(bindingRefId);
        memberLinkRepository.save(memberLink);
    }

    @Override
    @Transactional
    public UcMemberLinkItemResponse attachEnterpriseBuyerMember(Integer operatorUserId, Integer targetUserId, Integer memberLinkId) {
        UserUcOrgLink orgLink = ensureOrgLink(operatorUserId, UcOrgType.ENTERPRISE_BUYER, null);
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "目标用户不存在"));
        UserUcMemberLink memberLink = memberLinkRepository.findByIdAndOrgLinkId(memberLinkId, orgLink.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "成员关联不存在"));
        memberLink.setUserId(targetUserId);
        memberLinkRepository.save(memberLink);
        return toMemberItem(memberLink);
    }

    @Override
    @Transactional
    public UcMemberLinkItemResponse bindMemberToEmployeeBinding(Integer operatorUserId, UcOrgType orgType,
                                                                Integer bindingId, UcMemberLookupRequest request) {
        ensureOpenApiEnabled();
        UserUcOrgLink orgLink = ensureOrgLink(operatorUserId, orgType, request.getUcPRootId());
        BindingOwnership ownership = resolveBindingOwnership(operatorUserId, orgType, bindingId);
        String identityValue = request.getIdentityValue().trim();
        if (identityValue.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "身份标识不能为空");
        }

        memberLinkRepository.findByBindingRefTypeAndBindingRefId(ownership.bindingRefType(), bindingId)
                .ifPresent(memberLinkRepository::delete);

        Integer pStuId = resolvePStuId(orgLink.getUcPRootId(), identityValue);
        if (pStuId == null || pStuId <= 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "未在 UC 找到对应成员，无法绑定");
        }

        UserUcMemberLink memberLink = new UserUcMemberLink();
        memberLink.setOrgLinkId(orgLink.getId());
        memberLink.setIdentityValue(identityValue);
        memberLink.setUserId(ownership.counterpartUserId());
        memberLink.setBindingRefType(ownership.bindingRefType());
        memberLink.setBindingRefId(bindingId);
        memberLink.setPStuId(pStuId);
        memberLink.setSyncStatus(UcMemberSyncStatus.LOOKUP_ONLY.getCode());
        memberLinkRepository.save(memberLink);
        return toMemberItem(memberLink);
    }

    @Override
    @Transactional
    public void unbindMemberFromEmployeeBinding(Integer operatorUserId, UcOrgType orgType, Integer bindingId) {
        resolveBindingOwnership(operatorUserId, orgType, bindingId);
        String bindingRefType = bindingRefTypeOf(orgType);
        memberLinkRepository.findByBindingRefTypeAndBindingRefId(bindingRefType, bindingId)
                .ifPresentOrElse(memberLinkRepository::delete, () -> {
                    throw new BusinessException(ErrorCode.PARAM_INVALID, "该员工尚未绑定 UC 成员");
                });
    }

    @Override
    @Transactional(readOnly = true)
    public void enrichBindingsWithUcMembers(UcOrgType orgType, Integer orgEntityId, String bindingRefType,
                                            List<BindingItemResponse> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        orgLinkRepository.findByOrgTypeAndOrgId(orgType.getCode(), orgEntityId).ifPresent(orgLink -> {
            List<Integer> bindingIds = items.stream()
                    .map(BindingItemResponse::getId)
                    .filter(Objects::nonNull)
                    .toList();
            if (bindingIds.isEmpty()) {
                return;
            }
            Map<Integer, UserUcMemberLink> byBindingId = memberLinkRepository
                    .findByBindingRefTypeAndBindingRefIdIn(bindingRefType, bindingIds)
                    .stream()
                    .collect(Collectors.toMap(UserUcMemberLink::getBindingRefId, Function.identity(), (a, b) -> a));
            for (BindingItemResponse item : items) {
                UserUcMemberLink link = byBindingId.get(item.getId());
                if (link != null) {
                    item.setUcMember(toBrief(link));
                }
            }
        });
    }

    private UcMemberBriefResponse toBrief(UserUcMemberLink link) {
        return UcMemberBriefResponse.builder()
                .memberLinkId(link.getId())
                .pStuId(link.getPStuId())
                .identityValue(link.getIdentityValue())
                .profileSynced(Objects.equals(link.getSyncStatus(), UcMemberSyncStatus.PROFILE_SYNCED.getCode()))
                .build();
    }

    private BindingOwnership resolveBindingOwnership(Integer operatorUserId, UcOrgType orgType, Integer bindingId) {
        return switch (orgType) {
            case INSTITUTION -> {
                Institution inst = institutionRepository.findByUserId(operatorUserId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "非机构账号"));
                InstitutionEmployeeBinding binding = institutionEmployeeBindingRepository.findById(bindingId)
                        .filter(b -> Objects.equals(b.getOrgId(), inst.getId()))
                        .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "员工绑定不存在"));
                yield new BindingOwnership(BindingType.INSTITUTION_EMPLOYEE.name(), binding.getEmployeeUserId());
            }
            case ENTERPRISE_AGENT -> {
                EnterpriseAgent ea = enterpriseAgentRepository.findByUserId(operatorUserId)
                        .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "非经纪公司账号"));
                EnterpriseAgentMember binding = enterpriseAgentMemberRepository.findById(bindingId)
                        .filter(m -> Objects.equals(m.getEnterpriseAgentId(), ea.getId()))
                        .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "经纪人绑定不存在"));
                yield new BindingOwnership(BindingType.ENTERPRISE_AGENT_MEMBER.name(), binding.getAgentUserId());
            }
            default -> throw new BusinessException(ErrorCode.PARAM_INVALID, "该组织类型不支持员工 UC 绑定");
        };
    }

    private String bindingRefTypeOf(UcOrgType orgType) {
        return switch (orgType) {
            case INSTITUTION -> BindingType.INSTITUTION_EMPLOYEE.name();
            case ENTERPRISE_AGENT -> BindingType.ENTERPRISE_AGENT_MEMBER.name();
            default -> throw new BusinessException(ErrorCode.PARAM_INVALID, "该组织类型不支持");
        };
    }

    private record BindingOwnership(String bindingRefType, Integer counterpartUserId) {
    }

    private Integer resolvePStuId(int ucPRootId, String identityValue) {
        ObjectNode body = ucOpenApiClient.emptyBody();
        body.put("id_no", identityValue);
        JsonNode data = ucOpenApiClient.post(PATH_GET_STU_ID, body, ucPRootId);
        if (data == null || data.isNull()) {
            return null;
        }
        if (data.isNumber()) {
            return data.intValue();
        }
        if (data.isTextual()) {
            try {
                return Integer.parseInt(data.asText());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return data.path("id").asInt(0) > 0 ? data.path("id").asInt() : null;
    }

    private JsonNode fetchMemberPreview(int ucPRootId, int pStuId) {
        JsonNode profile = fetchMemberProfile(ucPRootId, pStuId);
        if (profile == null || profile.isNull()) {
            return null;
        }
        if (profile.isArray() && !profile.isEmpty()) {
            return profile.get(0);
        }
        return profile;
    }

    private JsonNode fetchMemberProfile(int ucPRootId, int pStuId) {
        ObjectNode body = ucOpenApiClient.emptyBody();
        ArrayNode stuIds = objectMapper.createArrayNode();
        stuIds.add(pStuId);
        body.set("stu_ids", stuIds);
        JsonNode data = ucOpenApiClient.post(PATH_USER_LIST, body, ucPRootId);
        if (data == null || data.isNull()) {
            return objectMapper.createObjectNode();
        }
        if (data.isArray() && !data.isEmpty()) {
            return data.get(0);
        }
        return data;
    }

    private UniqueValueInfo fetchUniqueValue(int ucPRootId) {
        JsonNode data = ucOpenApiClient.post(PATH_GET_UNIQUE_VALUE, ucOpenApiClient.emptyBody(), ucPRootId);
        int index = data.path("unique_value").asInt(3);
        String fieldCode = data.path("field_code").asText(null);
        if (fieldCode == null || fieldCode.isBlank()) {
            fieldCode = UcUniqueValueMapper.fieldCodeOfIndex(index);
        }
        return new UniqueValueInfo(index, fieldCode);
    }

    private UserUcOrgLink requireOrgLink(Integer operatorUserId, UcOrgType orgType) {
        OrgContext ctx = resolveOrgContext(operatorUserId, orgType);
        return orgLinkRepository.findByOrgTypeAndOrgId(orgType.getCode(), ctx.orgId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "尚未关联 UC 组织"));
    }

    /**
     * 确保组织已关联 UC 租户：无映射时按组织主体超管 uc_uid → UC bind_uid 自动解析 p_root_id 并校验落库。
     */
    private UserUcOrgLink ensureOrgLink(Integer operatorUserId, UcOrgType orgType, Integer requestedUcPRootId) {
        OrgContext ctx = resolveOrgContext(operatorUserId, orgType);
        Optional<UserUcOrgLink> existing = orgLinkRepository.findByOrgTypeAndOrgId(orgType.getCode(), ctx.orgId());
        if (existing.isPresent()) {
            return existing.get();
        }
        ensureOpenApiEnabled();
        int candidate = requestedUcPRootId != null && requestedUcPRootId > 0
                ? requestedUcPRootId
                : resolveAutoUcPRootId(orgType, ctx);
        if (candidate <= 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "无法自动关联 UC 组织，请联系管理员");
        }
        try {
            UniqueValueInfo uniqueInfo = fetchUniqueValue(candidate);
            UserUcOrgLink link = new UserUcOrgLink();
            link.setOrgType(orgType.getCode());
            link.setOrgId(ctx.orgId());
            link.setUcPRootId(candidate);
            link.setUniqueValue(uniqueInfo.index());
            link.setUniqueFieldCode(uniqueInfo.fieldCode());
            link.setLinkedBy(operatorUserId);
            return orgLinkRepository.save(link);
        } catch (BusinessException e) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "UC 组织自动关联失败：" + e.getMessage());
        }
    }

    /** 通过组织主体超管 uc_uid 在 UC 按 bind_uid 解析 root_company_id。 */
    private int resolveAutoUcPRootId(UcOrgType orgType, OrgContext ctx) {
        Integer ownerUserId = resolveOrgOwnerUserId(orgType, ctx.orgId());
        User owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "组织主体账号不存在"));
        Integer ucUid = owner.getUcUid();
        if (ucUid == null || ucUid <= 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "组织主体账号未关联 UCenter，无法自动关联 UC 组织");
        }
        return fetchRootCompanyIdByBindUid(ucUid);
    }

    private Integer resolveOrgOwnerUserId(UcOrgType orgType, int orgId) {
        return switch (orgType) {
            case INSTITUTION -> institutionRepository.findById(orgId)
                    .map(Institution::getUserId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "机构不存在"));
            case ENTERPRISE_AGENT -> enterpriseAgentRepository.findById(orgId)
                    .map(EnterpriseAgent::getUserId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "经纪公司不存在"));
            case ENTERPRISE_BUYER -> enterpriseBuyerRepository.findById(orgId)
                    .map(EnterpriseBuyer::getUserId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "企业采购方不存在"));
        };
    }

    private int fetchRootCompanyIdByBindUid(int bindUid) {
        ObjectNode body = ucOpenApiClient.emptyBody();
        body.put("bind_uid", bindUid);
        JsonNode data = ucOpenApiClient.postAppOnly(PATH_GET_ROOT_BY_BIND_UID, body);
        int rootCompanyId = data.path("root_company_id").asInt(0);
        if (rootCompanyId <= 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "未在 UC 找到该账号对应的组织");
        }
        return rootCompanyId;
    }

    private OrgContext resolveOrgContext(Integer operatorUserId, UcOrgType orgType) {
        return switch (orgType) {
            case INSTITUTION -> institutionRepository.findByUserId(operatorUserId)
                    .map(i -> new OrgContext(i.getId()))
                    .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "非机构账号"));
            case ENTERPRISE_AGENT -> enterpriseAgentRepository.findByUserId(operatorUserId)
                    .map(e -> new OrgContext(e.getId()))
                    .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "非经纪公司账号"));
            case ENTERPRISE_BUYER -> enterpriseBuyerRepository.findByUserId(operatorUserId)
                    .map(e -> new OrgContext(e.getId()))
                    .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "非企业采购方账号"));
        };
    }

    private void ensureOpenApiEnabled() {
        if (!ucOpenApiClient.isEnabled()) {
            throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "UC OpenAPI 未启用或未配置凭据");
        }
    }

    private UcOrgLinkResponse toOrgLinkResponse(UserUcOrgLink link) {
        return UcOrgLinkResponse.builder()
                .id(link.getId())
                .orgType(link.getOrgType())
                .orgId(link.getOrgId())
                .ucPRootId(link.getUcPRootId())
                .uniqueValue(link.getUniqueValue())
                .uniqueFieldCode(link.getUniqueFieldCode())
                .uniqueFieldLabel(UcUniqueValueMapper.labelOfFieldCode(link.getUniqueFieldCode()))
                .build();
    }

    private UcIdentityFieldResponse buildIdentityField(Integer uniqueValue, String fieldCode) {
        String code = fieldCode != null ? fieldCode : UcUniqueValueMapper.fieldCodeOfIndex(uniqueValue != null ? uniqueValue : 3);
        return UcIdentityFieldResponse.builder()
                .uniqueValue(uniqueValue)
                .fieldCode(code)
                .fieldLabel(UcUniqueValueMapper.labelOfFieldCode(code))
                .placeholder(UcUniqueValueMapper.placeholderOfFieldCode(code))
                .build();
    }

    private UcMemberLinkItemResponse toMemberItem(UserUcMemberLink link) {
        JsonNode profile = null;
        if (link.getProfileJson() != null && !link.getProfileJson().isBlank()) {
            try {
                profile = objectMapper.readTree(link.getProfileJson());
            } catch (Exception e) {
                log.warn("解析 profile_json 失败 id={}", link.getId(), e);
            }
        }
        return UcMemberLinkItemResponse.builder()
                .id(link.getId())
                .userId(link.getUserId())
                .identityValue(link.getIdentityValue())
                .pStuId(link.getPStuId())
                .syncStatus(link.getSyncStatus())
                .profile(profile)
                .bindingRefType(link.getBindingRefType())
                .bindingRefId(link.getBindingRefId())
                .createdAt(link.getCreatedAt())
                .build();
    }

    private record OrgContext(int orgId) {
    }

    private record UniqueValueInfo(int index, String fieldCode) {
    }
}
