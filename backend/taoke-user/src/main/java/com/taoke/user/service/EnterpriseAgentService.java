package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.enterpriseagent.EnterpriseAgentRequest;
import com.taoke.user.dto.enterpriseagent.EnterpriseAgentResponse;
import com.taoke.user.entity.EnterpriseAgent;
import com.taoke.user.mapper.EnterpriseAgentMapper;
import com.taoke.user.repository.EnterpriseAgentRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 专家经纪公司信息服务 — ENTERPRISE_AGENT 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Service
@RequiredArgsConstructor
public class EnterpriseAgentService {

    private final EnterpriseAgentRepository enterpriseAgentRepository;
    private final UserRoleRepository userRoleRepository;
    private final EnterpriseAgentMapper enterpriseAgentMapper;

    public EnterpriseAgentResponse getByUserId(Integer userId) {
        checkRole(userId);
        EnterpriseAgent ent = enterpriseAgentRepository.findByUserId(userId).orElse(null);
        if (ent == null) {
            return null;
        }
        return enterpriseAgentMapper.toResponse(ent);
    }

    /**
     * 保存专家经纪公司信息（有则更新、无则创建）
     */
    @Transactional
    public EnterpriseAgentResponse save(Integer userId, EnterpriseAgentRequest request) {
        checkRole(userId);
        EnterpriseAgent ent = enterpriseAgentRepository.findByUserId(userId).orElseGet(() -> {
            EnterpriseAgent e = new EnterpriseAgent();
            e.setUserId(userId);
            return e;
        });

        if (request.getCompanyName() != null) ent.setCompanyName(request.getCompanyName());
        if (request.getLicenseNo() != null) ent.setLicenseNo(request.getLicenseNo());
        if (request.getLegalPerson() != null) ent.setLegalPerson(request.getLegalPerson());
        if (request.getIndustry() != null) ent.setIndustry(request.getIndustry());
        if (request.getCompanySize() != null) ent.setCompanySize(request.getCompanySize());
        if (request.getContactName() != null) ent.setContactName(request.getContactName());
        if (request.getContactPhone() != null) ent.setContactPhone(request.getContactPhone());
        if (request.getPostCode() != null) ent.setPostCode(request.getPostCode());
        if (request.getProvinceId() != null) ent.setProvinceId(request.getProvinceId());
        if (request.getCityId() != null) ent.setCityId(request.getCityId());
        if (request.getDistrictId() != null) ent.setDistrictId(request.getDistrictId());
        if (request.getTownId() != null) ent.setTownId(request.getTownId());
        if (request.getAddress() != null) ent.setAddress(request.getAddress());
        if (request.getQualificationDocUrl() != null) ent.setQualificationDocUrl(request.getQualificationDocUrl());

        ent = enterpriseAgentRepository.save(ent);
        return enterpriseAgentMapper.toResponse(ent);
    }

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, "ENTERPRISE_AGENT")) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 ENTERPRISE_AGENT 角色");
        }
    }
}
