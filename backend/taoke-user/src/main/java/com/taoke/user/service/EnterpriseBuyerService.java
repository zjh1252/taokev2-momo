package com.taoke.user.service;

import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerRequest;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerResponse;
import com.taoke.user.entity.EnterpriseBuyer;
import com.taoke.user.mapper.EnterpriseBuyerMapper;
import com.taoke.user.repository.EnterpriseBuyerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 企业培训采购方信息服务 — ENTERPRISE_BUYER 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Service
@RequiredArgsConstructor
public class EnterpriseBuyerService {

    private final EnterpriseBuyerRepository enterpriseBuyerRepository;
    private final EnterpriseBuyerMapper enterpriseBuyerMapper;

    public EnterpriseBuyerResponse getByUserId(Integer userId) {
        EnterpriseBuyer ent = enterpriseBuyerRepository.findByUserId(userId).orElse(null);
        if (ent == null) {
            return null;
        }
        return enterpriseBuyerMapper.toResponse(ent);
    }

    /**
     * 保存企业培训采购方信息（有则更新、无则创建）
     */
    @Transactional
    public EnterpriseBuyerResponse save(Integer userId, EnterpriseBuyerRequest request) {
        EnterpriseBuyer ent = enterpriseBuyerRepository.findByUserId(userId).orElseGet(() -> {
            EnterpriseBuyer e = new EnterpriseBuyer();
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

        ent = enterpriseBuyerRepository.save(ent);
        return enterpriseBuyerMapper.toResponse(ent);
    }
}
