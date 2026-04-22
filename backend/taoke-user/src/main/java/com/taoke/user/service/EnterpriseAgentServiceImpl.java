package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.EnterpriseAgentService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.enterpriseagent.EnterpriseAgentRequest;
import com.taoke.user.dto.enterpriseagent.EnterpriseAgentResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.EnterpriseAgent;
import com.taoke.user.mapper.EnterpriseAgentMapper;
import com.taoke.user.repository.EnterpriseAgentRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 专家经纪公司信息服务 — ENTERPRISE_AGENT 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Service
@RequiredArgsConstructor
public class EnterpriseAgentServiceImpl implements EnterpriseAgentService {

    private final EnterpriseAgentRepository enterpriseAgentRepository;
    private final EnterpriseAgentMapper enterpriseAgentMapper;
    private final RoleApplyService roleApplyService;

    @Override
    public EnterpriseAgentResponse getByUserId(Integer userId) {
        EnterpriseAgent ent = enterpriseAgentRepository.findByUserId(userId).orElse(null);
        return ent == null ? null : enterpriseAgentMapper.toResponse(ent);
    }

    @Override
    @Transactional
    public EnterpriseAgentResponse save(Integer userId, EnterpriseAgentRequest request) {
        return enterpriseAgentMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    @Override
    @Transactional
    public void apply(Integer userId, EnterpriseAgentRequest request) {
        roleApplyService.apply(userId, BusinessRole.Code.ENTERPRISE_AGENT);
        saveOrUpdateExtension(userId, request);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.ENTERPRISE_AGENT);
    }

    @Override
    public Page<EnterpriseAgent> searchForAdmin(String search, Pageable pageable) {
        Specification<EnterpriseAgent> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("companyName"), pattern),
                        cb.like(root.get("contactName"), pattern),
                        cb.like(root.get("contactPhone"), pattern)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return enterpriseAgentRepository.findAll(spec, pageable);
    }

    @Override
    public List<Map<String, Object>> lookup(String keyword, int size) {
        int limit = size > 0 ? Math.min(size, 50) : 20;
        Specification<EnterpriseAgent> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim() + "%";
                predicates.add(cb.like(root.get("companyName"), pattern));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "id"));
        Page<EnterpriseAgent> page = enterpriseAgentRepository.findAll(spec, pageable);
        List<Map<String, Object>> list = new ArrayList<>();
        for (EnterpriseAgent ea : page.getContent()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", ea.getId());
            item.put("userId", ea.getUserId());
            item.put("companyName", ea.getCompanyName());
            item.put("legalPerson", ea.getLegalPerson());
            item.put("contactName", ea.getContactName());
            list.add(item);
        }
        return list;
    }

    @Override
    public List<EnterpriseAgent> findByUserIds(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return enterpriseAgentRepository.findByUserIdIn(userIds);
    }

    private EnterpriseAgent saveOrUpdateExtension(Integer userId, EnterpriseAgentRequest request) {
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

        return enterpriseAgentRepository.save(ent);
    }
}
