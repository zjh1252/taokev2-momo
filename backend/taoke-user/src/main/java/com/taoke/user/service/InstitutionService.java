package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.institution.InstitutionRequest;
import com.taoke.user.dto.institution.InstitutionResponse;
import com.taoke.user.entity.Institution;
import com.taoke.user.mapper.InstitutionMapper;
import com.taoke.user.repository.InstitutionRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 机构信息服务 — INSTITUTION 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;
    private final UserRoleRepository userRoleRepository;
    private final InstitutionMapper institutionMapper;

    public InstitutionResponse getByUserId(Integer userId) {
        checkRole(userId);
        Institution ent = institutionRepository.findByUserId(userId).orElse(null);
        if (ent == null) {
            return null;
        }
        return institutionMapper.toResponse(ent);
    }

    /**
     * 保存机构信息（有则更新、无则创建）
     */
    @Transactional
    public InstitutionResponse save(Integer userId, InstitutionRequest request) {
        checkRole(userId);
        Institution ent = institutionRepository.findByUserId(userId).orElseGet(() -> {
            Institution e = new Institution();
            e.setUserId(userId);
            return e;
        });

        if (request.getOrgName() != null) ent.setOrgName(request.getOrgName());
        if (request.getOrgType() != null) ent.setOrgType(request.getOrgType());
        if (request.getLicenseNo() != null) ent.setLicenseNo(request.getLicenseNo());
        if (request.getBio() != null) ent.setBio(request.getBio());
        if (request.getHomepageConfig() != null) ent.setHomepageConfig(request.getHomepageConfig());
        if (request.getContactName() != null) ent.setContactName(request.getContactName());
        if (request.getContactPhone() != null) ent.setContactPhone(request.getContactPhone());
        if (request.getShowContact() != null) ent.setShowContact(request.getShowContact());
        if (request.getPostCode() != null) ent.setPostCode(request.getPostCode());
        if (request.getProvinceId() != null) ent.setProvinceId(request.getProvinceId());
        if (request.getCityId() != null) ent.setCityId(request.getCityId());
        if (request.getDistrictId() != null) ent.setDistrictId(request.getDistrictId());
        if (request.getTownId() != null) ent.setTownId(request.getTownId());
        if (request.getAddress() != null) ent.setAddress(request.getAddress());

        ent = institutionRepository.save(ent);
        return institutionMapper.toResponse(ent);
    }

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, "INSTITUTION")) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 INSTITUTION 角色");
        }
    }
}
