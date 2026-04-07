package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.institution.InstitutionPublicResponse;
import com.taoke.user.dto.institution.InstitutionRequest;
import com.taoke.user.dto.institution.InstitutionResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Institution;
import com.taoke.user.mapper.InstitutionMapper;
import com.taoke.user.repository.InstitutionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 机构信息服务 — INSTITUTION 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Service
@RequiredArgsConstructor
public class InstitutionServiceImpl implements com.taoke.user.api.InstitutionService {

    private final InstitutionRepository institutionRepository;
    private final InstitutionMapper institutionMapper;
    private final RoleApplyService roleApplyService;

    @Override
    public InstitutionResponse getByUserId(Integer userId) {
        Institution ent = institutionRepository.findByUserId(userId).orElse(null);
        return ent == null ? null : institutionMapper.toResponse(ent);
    }

    @Override
    @Transactional
    public InstitutionResponse save(Integer userId, InstitutionRequest request) {
        return institutionMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    @Override
    @Transactional
    public void apply(Integer userId, InstitutionRequest request) {
        roleApplyService.apply(userId, BusinessRole.Code.INSTITUTION);
        saveOrUpdateExtension(userId, request);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.INSTITUTION);
    }

    @Override
    public PageResponse<InstitutionListItemResponse> listPublic(int page, int size,
                                                                 String keyword, String sort) {
        Sort jpaSort = "popularity".equals(sort)
                ? Sort.by(Sort.Direction.DESC, "viewCount").and(Sort.by(Sort.Direction.DESC, "id"))
                : Sort.by(Sort.Direction.DESC, "sortOrder")
                      .and(Sort.by(Sort.Direction.DESC, "viewCount"))
                      .and(Sort.by(Sort.Direction.DESC, "id"));

        PageRequest pageable = PageRequest.of(page - 1, size, jpaSort);

        Specification<Institution> spec = buildListSpec(keyword);
        Page<Institution> result = institutionRepository.findAll(spec, pageable);

        if (result.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<InstitutionListItemResponse> items = result.getContent().stream()
                .map(institutionMapper::toListItemResponse)
                .toList();

        return PageResponse.of(items, result.getTotalElements(), page, size);
    }

    @Override
    public InstitutionPublicResponse getPublicProfile(Integer id) {
        Institution institution = institutionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "机构不存在"));

        if (institution.getStatus() != 1) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "机构不存在");
        }

        InstitutionPublicResponse resp = institutionMapper.toPublicResponse(institution);

        // 联系方式仅在公开时返回
        if (institution.getShowContact() == null || institution.getShowContact() != 1) {
            resp.setContactName(null);
            resp.setContactPhone(null);
        }

        return resp;
    }

    /** 构建公开列表查询的动态条件（仅状态=1 的已发布机构） */
    private Specification<Institution> buildListSpec(String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), 1));

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("orgName"), pattern),
                        cb.like(root.get("specialties"), pattern),
                        cb.like(root.get("industries"), pattern)
                ));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Institution saveOrUpdateExtension(Integer userId, InstitutionRequest request) {
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

        return institutionRepository.save(ent);
    }
}
