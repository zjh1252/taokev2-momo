package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerRequest;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.EnterpriseBuyer;
import com.taoke.user.mapper.EnterpriseBuyerMapper;
import com.taoke.user.repository.EnterpriseBuyerRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 企业培训采购方信息服务 — ENTERPRISE_BUYER 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Service
@RequiredArgsConstructor
public class EnterpriseBuyerServiceImpl implements com.taoke.user.api.EnterpriseBuyerService {

    private final EnterpriseBuyerRepository enterpriseBuyerRepository;
    private final EnterpriseBuyerMapper enterpriseBuyerMapper;
    private final RoleApplyService roleApplyService;

    @Override
    public EnterpriseBuyerResponse getByUserId(Integer userId) {
        EnterpriseBuyer ent = enterpriseBuyerRepository.findByUserId(userId).orElse(null);
        if (ent == null) {
            return null;
        }
        return enterpriseBuyerMapper.toResponse(ent);
    }

    @Override
    @Transactional
    public EnterpriseBuyerResponse save(Integer userId, EnterpriseBuyerRequest request) {
        return enterpriseBuyerMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    @Override
    @Transactional
    public void apply(Integer userId, EnterpriseBuyerRequest request) {
        // 企业培训采购方无需资质认证 — 直接自动通过并发送角色生效通知
        saveOrUpdateExtension(userId, request);
        roleApplyService.applyAndAutoApprove(userId, BusinessRole.Code.ENTERPRISE_BUYER);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.ENTERPRISE_BUYER);
    }

    @Override
    public Page<EnterpriseBuyer> searchForAdmin(String search, Pageable pageable) {
        Specification<EnterpriseBuyer> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("companyName"), pattern),
                        cb.like(root.get("contactPhone"), pattern)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return enterpriseBuyerRepository.findAll(spec, pageable);
    }

    @Override
    public List<EnterpriseBuyer> findByUserIds(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return enterpriseBuyerRepository.findByUserIdIn(userIds);
    }

    private EnterpriseBuyer saveOrUpdateExtension(Integer userId, EnterpriseBuyerRequest request) {
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
        return ent;
    }
}
