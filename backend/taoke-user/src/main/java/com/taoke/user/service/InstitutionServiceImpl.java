package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.common.service.RegionService;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
    private final RegionService regionService;

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
                                                                 String keyword, String sort,
                                                                 Boolean association) {
        Sort jpaSort = "popularity".equals(sort)
                ? Sort.by(Sort.Direction.DESC, "viewCount").and(Sort.by(Sort.Direction.DESC, "id"))
                : Sort.by(Sort.Direction.DESC, "sortOrder")
                      .and(Sort.by(Sort.Direction.DESC, "viewCount"))
                      .and(Sort.by(Sort.Direction.DESC, "id"));

        PageRequest pageable = PageRequest.of(page - 1, size, jpaSort);

        Specification<Institution> spec = buildListSpec(keyword, association);
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

        // 回填省 / 市名称（详情头部「所在地」展示用）
        List<Integer> regionIds = new ArrayList<>();
        if (institution.getProvinceId() != null && institution.getProvinceId() > 0) {
            regionIds.add(institution.getProvinceId());
        }
        if (institution.getCityId() != null && institution.getCityId() > 0) {
            regionIds.add(institution.getCityId());
        }
        if (!regionIds.isEmpty()) {
            Map<Integer, String> nameMap = regionService.getNamesByIds(regionIds);
            resp.setProvinceName(nameMap.get(institution.getProvinceId()));
            resp.setCityName(nameMap.get(institution.getCityId()));
        }

        return resp;
    }

    /** 构建公开列表查询的动态条件（仅状态=1 的已发布机构） */
    private Specification<Institution> buildListSpec(String keyword, Boolean association) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), 1));

            if (association != null) {
                predicates.add(cb.equal(root.get("association"), association));
            }

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

    @Override
    public Page<Institution> searchForAdmin(String search, Integer status, Pageable pageable) {
        Specification<Institution> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("orgName"), pattern),
                        cb.like(root.get("contactPhone"), pattern)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return institutionRepository.findAll(spec, pageable);
    }

    @Override
    @Transactional
    public void setAssociation(Integer institutionId, boolean association) {
        Institution inst = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "机构不存在"));
        inst.setAssociation(association);
        institutionRepository.save(inst);
    }

    @Override
    public List<Institution> findByUserIds(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return institutionRepository.findByUserIdIn(userIds);
    }

    @Override
    public List<Institution> findByIds(java.util.Collection<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return institutionRepository.findAllById(ids);
    }

    @Override
    @Transactional
    public void adjustCommentCount(Integer institutionId, int delta) {
        if (institutionId == null || delta == 0) return;
        institutionRepository.findById(institutionId).ifPresent(inst -> {
            int cur = inst.getCommentCount() == null ? 0 : inst.getCommentCount();
            int next = Math.max(0, cur + delta);
            inst.setCommentCount(next);
            institutionRepository.save(inst);
        });
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
        if (request.getClientCases() != null) ent.setClientCases(request.getClientCases());
        if (request.getSuccessCases() != null) ent.setSuccessCases(request.getSuccessCases());

        return institutionRepository.save(ent);
    }
}
