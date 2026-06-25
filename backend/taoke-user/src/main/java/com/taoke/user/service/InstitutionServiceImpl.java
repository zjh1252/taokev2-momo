package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.common.service.RegionService;
import com.taoke.common.util.LegacyAvatarUrls;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.institution.InstitutionPublicResponse;
import com.taoke.user.dto.institution.InstitutionRequest;
import com.taoke.user.dto.institution.InstitutionResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Institution;
import com.taoke.user.mapper.InstitutionMapper;
import com.taoke.user.repository.InstitutionRepository;
import com.taoke.user.repository.UserRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 机构信息服务 — INSTITUTION 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Service
@RequiredArgsConstructor
public class InstitutionServiceImpl implements com.taoke.user.api.InstitutionService {

    private static final String DEFAULT_AGREEMENT_VERSION = "v1";

    private final InstitutionRepository institutionRepository;
    private final InstitutionMapper institutionMapper;
    private final RoleApplyService roleApplyService;
    private final RegionService regionService;
    private final CategoryService categoryService;
    private final OpsMaterialResolver opsMaterialResolver;
    private final UserRepository userRepository;

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
        if (request == null || !Boolean.TRUE.equals(request.getAgreementSigned())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID,
                    "请先勾选并同意《淘课网注册培训机构合作协议》");
        }
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
                                                                 Boolean association,
                                                                 Integer expertiseCategoryId,
                                                                 Integer industryCategoryId,
                                                                 Integer provinceId,
                                                                 Integer cityId) {
        Sort jpaSort = switch (sort != null ? sort : "") {
            case "popularity" -> Sort.by(Sort.Direction.DESC, "viewCount")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "popularity_asc" -> Sort.by(Sort.Direction.ASC, "viewCount")
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "default_asc" -> Sort.by(Sort.Direction.ASC, "sortOrder")
                    .and(Sort.by(Sort.Direction.ASC, "viewCount"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "newly_joined" -> Sort.by(Sort.Direction.DESC, "createdAt")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            default -> Sort.by(Sort.Direction.DESC, "sortOrder")
                    .and(Sort.by(Sort.Direction.DESC, "viewCount"))
                    .and(Sort.by(Sort.Direction.DESC, "id"));
        };

        PageRequest pageable = PageRequest.of(page - 1, size, jpaSort);

        Specification<Institution> spec = buildListSpec(
                keyword, association, expertiseCategoryId, industryCategoryId, provinceId, cityId);
        Page<Institution> result = institutionRepository.findAll(spec, pageable);

        if (result.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<Institution> institutions = result.getContent();
        Set<Integer> regionIds = new HashSet<>();
        for (Institution inst : institutions) {
            if (inst.getProvinceId() != null && inst.getProvinceId() > 0) {
                regionIds.add(inst.getProvinceId());
            }
            if (inst.getCityId() != null && inst.getCityId() > 0) {
                regionIds.add(inst.getCityId());
            }
        }
        Map<Integer, String> regionNameMap = regionIds.isEmpty()
                ? Map.of()
                : regionService.getNamesByIds(regionIds);

        List<InstitutionListItemResponse> items = institutions.stream()
                .map(inst -> {
                    InstitutionListItemResponse item = institutionMapper.toListItemResponse(inst);
                    item.setProvinceName(resolveRegionDisplayName(inst.getProvinceId(), regionNameMap));
                    item.setCityName(resolveRegionDisplayName(inst.getCityId(), regionNameMap));
                    return item;
                })
                .toList();
        fillMissingLogos(institutions, items);
        resolveCategoryDisplayNames(items);

        return PageResponse.of(items, result.getTotalElements(), page, size);
    }

    @Override
    public Map<Integer, Long> countPublicByExpertiseL1(Boolean association) {
        return toCountMap(institutionRepository.countPublicByExpertiseL1(association));
    }

    @Override
    public List<InstitutionListItemResponse> listRecommended(String type, Boolean association, int limit) {
        int n = limit > 0 ? Math.min(limit, 20) : 5;
        Sort sort = switch (type != null ? type : "") {
            case "high_score" -> Sort.by(Sort.Direction.DESC, "score")
                    .and(Sort.by(Sort.Direction.DESC, "viewCount"))
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "weekly_active" -> Sort.by(Sort.Direction.DESC, "updatedAt")
                    .and(Sort.by(Sort.Direction.DESC, "viewCount"))
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "newly_joined" -> Sort.by(Sort.Direction.DESC, "createdAt")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            default -> Sort.by(Sort.Direction.DESC, "sortOrder")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
        };
        Specification<Institution> spec = buildListSpec(null, association, null, null, null, null);
        Page<Institution> page = institutionRepository.findAll(spec, PageRequest.of(0, n, sort));
        if (page.isEmpty()) {
            return List.of();
        }
        List<Institution> institutions = page.getContent();
        Set<Integer> regionIds = new HashSet<>();
        for (Institution inst : institutions) {
            if (inst.getProvinceId() != null && inst.getProvinceId() > 0) {
                regionIds.add(inst.getProvinceId());
            }
            if (inst.getCityId() != null && inst.getCityId() > 0) {
                regionIds.add(inst.getCityId());
            }
        }
        Map<Integer, String> regionNameMap = regionIds.isEmpty()
                ? Map.of()
                : regionService.getNamesByIds(regionIds);
        List<InstitutionListItemResponse> items = institutions.stream()
                .map(inst -> {
                    InstitutionListItemResponse item = institutionMapper.toListItemResponse(inst);
                    item.setProvinceName(resolveRegionDisplayName(inst.getProvinceId(), regionNameMap));
                    item.setCityName(resolveRegionDisplayName(inst.getCityId(), regionNameMap));
                    return item;
                })
                .toList();
        fillMissingLogos(institutions, items);
        resolveCategoryDisplayNames(items);
        return items;
    }

    @Override
    public InstitutionPublicResponse getPublicProfile(Integer id) {
        Institution institution = resolvePublicByPathId(id);
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
            resp.setProvinceName(resolveRegionDisplayName(institution.getProvinceId(), nameMap));
            resp.setCityName(resolveRegionDisplayName(institution.getCityId(), nameMap));
        }

        if (isBlankLogo(resp.getLogoUrl())) {
            resp.setLogoUrl(lookupLogoByOrgName(resp.getOrgName()));
        }
        resp.setLogoUrl(resolveInstitutionDisplayLogo(institution, resp.getLogoUrl()));

        Map<Integer, String> categoryNameMap = loadCategoryNameMap(resp.getSpecialties(), resp.getIndustries());
        resp.setSpecialties(resolveCategoryLabelString(resp.getSpecialties(), categoryNameMap));
        resp.setIndustries(resolveCategoryLabelString(resp.getIndustries(), categoryNameMap));

        return resp;
    }

    @Transactional
    @Override
    public void incrementViewCount(Integer institutionId) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "机构不存在"));
        if (institution.getStatus() == null || institution.getStatus() != 1
                || !Boolean.TRUE.equals(institution.getPublicListEligible())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "机构不存在");
        }
        institution.setViewCount((institution.getViewCount() != null ? institution.getViewCount() : 0) + 1);
        institutionRepository.save(institution);
    }

    @Override
    public Institution resolvePublicByPathId(Integer pathId) {
        if (pathId == null || pathId <= 0) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "机构不存在");
        }

        // 老站 URL：/company/{roleid}.htm
        Optional<Institution> byLegacyRole = institutionRepository
                .findFirstByLegacyRoleIdAndStatusAndPublicListEligibleTrue(pathId, 1, true);
        if (byLegacyRole.isPresent()) {
            return byLegacyRole.get();
        }

        Optional<Institution> byId = institutionRepository.findById(pathId);
        if (byId.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "机构不存在");
        }

        Institution institution = byId.get();
        if (institution.getStatus() != 1) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "机构不存在");
        }

        if (Boolean.TRUE.equals(institution.getPublicListEligible())) {
            return institution;
        }

        return findCanonicalPublicByOrgName(institution.getOrgName())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "机构不存在"));
    }

    /** 同名机构保留 id=user_id 优先、view_count 更高者 */
    private Optional<Institution> findCanonicalPublicByOrgName(String orgName) {
        if (orgName == null || orgName.isBlank()) {
            return Optional.empty();
        }
        Specification<Institution> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), 1),
                cb.equal(root.get("publicListEligible"), true),
                cb.equal(root.get("orgName"), orgName.trim())
        );
        List<Institution> candidates = institutionRepository.findAll(spec);
        if (candidates.isEmpty()) {
            return Optional.empty();
        }
        Institution best = candidates.get(0);
        for (Institution candidate : candidates) {
            if (isPreferredCanonical(candidate, best)) {
                best = candidate;
            }
        }
        return Optional.of(best);
    }

    private static boolean isPreferredCanonical(Institution candidate, Institution current) {
        int candidateRank = canonicalRank(candidate);
        int currentRank = canonicalRank(current);
        if (candidateRank != currentRank) {
            return candidateRank < currentRank;
        }
        int viewCmp = Integer.compare(
                candidate.getViewCount() != null ? candidate.getViewCount() : 0,
                current.getViewCount() != null ? current.getViewCount() : 0);
        if (viewCmp != 0) {
            return viewCmp > 0;
        }
        return candidate.getId() > current.getId();
    }

    private static int canonicalRank(Institution institution) {
        if (institution.getId() != null && institution.getId().equals(institution.getUserId())) {
            return 0;
        }
        return 1;
    }

    private String resolveRegionDisplayName(Integer regionId, Map<Integer, String> regionNameMap) {
        if (regionId == null || regionId <= 0) {
            return null;
        }
        String name = regionNameMap.get(regionId);
        if (name != null && !name.isBlank()) {
            return name;
        }
        String legacy = regionService.getNameByLegacyRegionId(regionId);
        return legacy.isBlank() ? null : legacy;
    }

    /** 列表项批量将 specialties / industries 中的分类 ID 解析为展示名称 */
    private void resolveCategoryDisplayNames(List<InstitutionListItemResponse> items) {
        if (items.isEmpty()) {
            return;
        }
        Set<Integer> categoryIds = new HashSet<>();
        for (InstitutionListItemResponse item : items) {
            collectCategoryIds(item.getSpecialties(), categoryIds);
            collectCategoryIds(item.getIndustries(), categoryIds);
        }
        Map<Integer, String> nameMap = categoryIds.isEmpty()
                ? Map.of()
                : categoryService.getNameMap(categoryIds);
        for (InstitutionListItemResponse item : items) {
            item.setSpecialties(resolveCategoryLabelString(item.getSpecialties(), nameMap));
            item.setIndustries(resolveCategoryLabelString(item.getIndustries(), nameMap));
        }
    }

    private Map<Integer, String> loadCategoryNameMap(String... rawValues) {
        Set<Integer> categoryIds = new HashSet<>();
        for (String raw : rawValues) {
            collectCategoryIds(raw, categoryIds);
        }
        return categoryIds.isEmpty() ? Map.of() : categoryService.getNameMap(categoryIds);
    }

    private static void collectCategoryIds(String raw, Set<Integer> ids) {
        if (raw == null || raw.isBlank()) {
            return;
        }
        for (String part : raw.split(",")) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                ids.add(Integer.parseInt(trimmed));
            } catch (NumberFormatException ignored) {
                // 已是展示文本或非 ID 格式，跳过
            }
        }
    }

    /** 将逗号分隔的分类 ID 串转为中文名称串；非数字片段原样保留 */
    private static String resolveCategoryLabelString(String raw, Map<Integer, String> nameMap) {
        if (raw == null || raw.isBlank()) {
            return raw;
        }
        List<String> labels = new ArrayList<>();
        for (String part : raw.split(",")) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                int id = Integer.parseInt(trimmed);
                String name = nameMap.get(id);
                labels.add(name != null ? name : trimmed);
            } catch (NumberFormatException e) {
                labels.add(trimmed);
            }
        }
        return labels.isEmpty() ? raw : String.join("，", labels);
    }

    private static Map<Integer, Long> toCountMap(List<Object[]> rows) {
        Map<Integer, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row[0] == null) {
                continue;
            }
            long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            map.put(((Number) row[0]).intValue(), count);
        }
        return map;
    }

    /** partner 迁移行 logo 常为空，从同名 organ 行补 Logo，老站机构再回退默认头像素材池 */
    private void fillMissingLogos(List<Institution> institutions, List<InstitutionListItemResponse> items) {
        List<String> names = items.stream()
                .filter(item -> isBlankLogo(item.getLogoUrl()))
                .map(InstitutionListItemResponse::getOrgName)
                .filter(name -> name != null && !name.isBlank())
                .distinct()
                .toList();
        Map<String, String> logoByOrgName = names.isEmpty() ? Map.of() : loadLogoByOrgNames(names);
        for (int i = 0; i < items.size(); i++) {
            InstitutionListItemResponse item = items.get(i);
            if (isBlankLogo(item.getLogoUrl())) {
                item.setLogoUrl(logoByOrgName.get(item.getOrgName()));
            }
            Institution institution = institutions.get(i);
            item.setLogoUrl(resolveInstitutionDisplayLogo(institution, item.getLogoUrl()));
        }
    }

    private String lookupLogoByOrgName(String orgName) {
        if (orgName == null || orgName.isBlank()) {
            return null;
        }
        return loadLogoByOrgNames(List.of(orgName)).get(orgName);
    }

    private Map<String, String> loadLogoByOrgNames(List<String> orgNames) {
        if (orgNames.isEmpty()) {
            return Map.of();
        }
        Map<String, String> map = new HashMap<>();
        for (Object[] row : institutionRepository.findLogoRowsByOrgNames(orgNames)) {
            String name = row[0] != null ? row[0].toString() : null;
            String logo = row[1] != null ? row[1].toString().trim() : null;
            if (name != null && logo != null && !logo.isEmpty()) {
                map.putIfAbsent(name, logo);
            }
        }
        return map;
    }

    private static boolean isBlankLogo(String logoUrl) {
        return logoUrl == null || logoUrl.isBlank() || isPlaceholderLogo(logoUrl);
    }

    private static boolean isPlaceholderLogo(String logoUrl) {
        return LegacyAvatarUrls.isPlaceholder(logoUrl);
    }

    /** 老站迁移机构才使用默认头像素材；新注册机构仅保留 Logo 上传 */
    private boolean allowDefaultInstitutionAvatar(Institution institution) {
        if (institution == null) {
            return false;
        }
        if (institution.getLegacyRoleId() != null && institution.getLegacyRoleId() > 0) {
            return true;
        }
        if (institution.getUserId() == null) {
            return false;
        }
        return userRepository.findById(institution.getUserId())
                .map(u -> Integer.valueOf(2).equals(u.getUserSource()))
                .orElse(false);
    }

    private String resolveInstitutionDisplayLogo(Institution institution, String logoUrl) {
        if (LegacyAvatarUrls.isUsable(logoUrl)) {
            return LegacyAvatarUrls.normalize(logoUrl);
        }
        if (!allowDefaultInstitutionAvatar(institution)) {
            return logoUrl != null ? logoUrl : "";
        }
        int seed = institution.getId() != null ? institution.getId() : 0;
        return opsMaterialResolver.resolveAvatarUrl(logoUrl, "INSTITUTION", true, seed);
    }

    /** 构建公开列表查询的动态条件（仅状态=1 的已发布机构） */
    private Specification<Institution> buildListSpec(String keyword, Boolean association,
                                                   Integer expertiseCategoryId,
                                                   Integer industryCategoryId,
                                                   Integer provinceId,
                                                   Integer cityId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), 1));
            predicates.add(cb.equal(root.get("publicListEligible"), true));
            // 迁移占位名，公开列表不展示
            predicates.add(cb.notLike(root.get("orgName"), "未命名机构#%"));

            if (provinceId != null && provinceId > 0) {
                predicates.add(cb.equal(root.get("provinceId"), provinceId));
            }

            if (cityId != null && cityId > 0) {
                predicates.add(cb.equal(root.get("cityId"), cityId));
            }

            if (association != null) {
                predicates.add(cb.equal(root.get("association"), association));
            }

            if (expertiseCategoryId != null && expertiseCategoryId > 0) {
                predicates.add(categoryIdInCommaField(root, cb, "specialties", expertiseCategoryId));
            }

            if (industryCategoryId != null && industryCategoryId > 0) {
                predicates.add(categoryIdInCommaField(root, cb, "industries", industryCategoryId));
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

    private static Predicate categoryIdInCommaField(Root<Institution> root, CriteriaBuilder cb,
                                                    String field, Integer categoryId) {
        String idStr = categoryId.toString();
        return cb.or(
                cb.equal(root.get(field), idStr),
                cb.like(root.get(field), idStr + ",%"),
                cb.like(root.get(field), "%," + idStr + ",%"),
                cb.like(root.get(field), "%," + idStr)
        );
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
    @Transactional
    public void setRecommended(Integer institutionId, Integer value) {
        Institution inst = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "机构不存在"));
        inst.setIsRecommended(value != null && value == 1 ? 1 : 0);
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
    public List<Map<String, Object>> lookup(String keyword, int size) {
        int limit = size > 0 ? Math.min(size, 50) : 20;

        // 关键字为纯数字时优先按 id 精确查（仍要求 status=1），未命中再走名称 LIKE
        String trimmed = keyword == null ? null : keyword.trim();
        if (trimmed != null && !trimmed.isEmpty() && trimmed.matches("\\d+")) {
            try {
                Integer id = Integer.parseInt(trimmed);
                Institution exact = institutionRepository.findById(id).orElse(null);
                if (exact != null && exact.getStatus() != null && exact.getStatus() == 1) {
                    return List.of(toLookupItem(exact));
                }
            } catch (NumberFormatException ignored) {
                // 长数字转 Integer 失败时退回模糊查
            }
        }

        Specification<Institution> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            // 仅匹配已发布的机构
            predicates.add(cb.equal(root.get("status"), 1));
            if (trimmed != null && !trimmed.isEmpty()) {
                String pattern = "%" + trimmed + "%";
                predicates.add(cb.like(root.get("orgName"), pattern));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        Pageable pageable = PageRequest.of(0, limit,
                Sort.by(Sort.Direction.DESC, "sortOrder")
                        .and(Sort.by(Sort.Direction.DESC, "viewCount"))
                        .and(Sort.by(Sort.Direction.DESC, "id")));
        Page<Institution> page = institutionRepository.findAll(spec, pageable);
        List<Map<String, Object>> list = new ArrayList<>();
        for (Institution inst : page.getContent()) {
            list.add(toLookupItem(inst));
        }
        return list;
    }

    private Map<String, Object> toLookupItem(Institution inst) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", inst.getId());
        item.put("userId", inst.getUserId());
        item.put("orgName", inst.getOrgName());
        item.put("association", inst.getAssociation());
        item.put("address", inst.getAddress());
        return item;
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
        if (request.getLegalRepresentative() != null) ent.setLegalRepresentative(request.getLegalRepresentative());
        if (request.getLicenseNo() != null) ent.setLicenseNo(request.getLicenseNo());
        if (request.getEstablishedAt() != null) ent.setEstablishedAt(request.getEstablishedAt());
        if (request.getLogoUrl() != null) ent.setLogoUrl(request.getLogoUrl());
        if (request.getBio() != null) ent.setBio(request.getBio());
        if (request.getIndustryCategoryIds() != null) {
            ent.setIndustries(serializeCategoryIds(request.getIndustryCategoryIds()));
        }
        if (request.getExpertiseCategoryIds() != null) {
            ent.setSpecialties(serializeCategoryIds(request.getExpertiseCategoryIds()));
        }
        if (request.getHasVenue() != null) ent.setHasVenue(request.getHasVenue());
        if (request.getHasExperts() != null) ent.setHasExperts(request.getHasExperts());
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

        // 协议：首次同意时回写时间与版本，已签署不覆盖时间
        if (Boolean.TRUE.equals(request.getAgreementSigned())) {
            if (ent.getAgreementSignedAt() == null) {
                ent.setAgreementSignedAt(LocalDateTime.now());
            }
            String version = request.getAgreementVersion();
            ent.setAgreementVersion(version != null && !version.isBlank()
                    ? version : DEFAULT_AGREEMENT_VERSION);
        }

        return institutionRepository.save(ent);
    }

    /** 分类 ID 列表序列化为「1,2,3」逗号串；null/空均落 null。 */
    private String serializeCategoryIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return null;
        }
        return ids.stream()
                .filter(java.util.Objects::nonNull)
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }
}
