package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.enterprise.EnterpriseInfoRequest;
import com.taoke.user.dto.enterprise.EnterpriseInfoResponse;
import com.taoke.user.entity.Enterprise;
import com.taoke.user.repository.EnterpriseRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 企业信息服务 — ENTERPRISE_BUYER 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Service
@RequiredArgsConstructor
public class EnterpriseService {

    private final EnterpriseRepository enterpriseRepository;
    private final UserRoleRepository userRoleRepository;

    public EnterpriseInfoResponse getByUserId(Integer userId) {
        checkRole(userId);
        Enterprise ent = enterpriseRepository.findByUserId(userId).orElse(null);
        if (ent == null) {
            return null;
        }
        return toResponse(ent);
    }

    /**
     * 保存企业信息（有则更新、无则创建）
     */
    @Transactional
    public EnterpriseInfoResponse save(Integer userId, EnterpriseInfoRequest request) {
        checkRole(userId);
        Enterprise ent = enterpriseRepository.findByUserId(userId).orElseGet(() -> {
            Enterprise e = new Enterprise();
            e.setUserId(userId);
            return e;
        });

        if (request.getCompanyName() != null) ent.setCompanyName(request.getCompanyName());
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
        if (request.getTrainingTags() != null) ent.setTrainingTags(request.getTrainingTags());

        ent = enterpriseRepository.save(ent);
        return toResponse(ent);
    }

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, "ENTERPRISE_BUYER")) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 ENTERPRISE_BUYER 角色");
        }
    }

    private EnterpriseInfoResponse toResponse(Enterprise ent) {
        EnterpriseInfoResponse resp = new EnterpriseInfoResponse();
        resp.setId(ent.getId());
        resp.setCompanyName(ent.getCompanyName());
        resp.setIndustry(ent.getIndustry());
        resp.setCompanySize(ent.getCompanySize());
        resp.setContactName(ent.getContactName());
        resp.setContactPhone(ent.getContactPhone());
        resp.setPostCode(ent.getPostCode());
        resp.setProvinceId(ent.getProvinceId());
        resp.setCityId(ent.getCityId());
        resp.setDistrictId(ent.getDistrictId());
        resp.setTownId(ent.getTownId());
        resp.setAddress(ent.getAddress());
        resp.setTrainingTags(ent.getTrainingTags());
        resp.setCreatedAt(ent.getCreatedAt());
        resp.setUpdatedAt(ent.getUpdatedAt());
        return resp;
    }
}
