package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 专家经纪公司信息服务 — ENTERPRISE_AGENT 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Service
@RequiredArgsConstructor
public class EnterpriseAgentServiceImpl implements EnterpriseAgentService {

    private static final String DEFAULT_AGREEMENT_VERSION = "v1";

    private final EnterpriseAgentRepository enterpriseAgentRepository;
    private final EnterpriseAgentMapper enterpriseAgentMapper;
    private final RoleApplyService roleApplyService;
    private final RoleApplicationChangeLogService changeLogService;

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
        if (request == null || !Boolean.TRUE.equals(request.getAgreementSigned())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID,
                    "请先勾选并同意《淘课网注册专家经纪公司合作协议》");
        }
        // 在写数据前先获取旧快照（用于资料重审变更记录）
        EnterpriseAgent oldSnapshot = enterpriseAgentRepository.findByUserId(userId).orElse(null);
        boolean isReapply = roleApplyService.apply(userId, BusinessRole.Code.ENTERPRISE_AGENT);
        saveOrUpdateExtension(userId, request);
        if (isReapply && oldSnapshot != null && changeLogService != null) {
            EnterpriseAgent newSnapshot = enterpriseAgentRepository.findByUserId(userId).orElse(null);
            if (newSnapshot != null) {
                String batch = RoleApplicationChangeLogService.batchKey(userId, BusinessRole.Code.ENTERPRISE_AGENT);
                changeLogService.recordChanges(userId, BusinessRole.Code.ENTERPRISE_AGENT, batch,
                        toFieldMap(oldSnapshot), toFieldMap(newSnapshot), EA_FIELD_LABELS);
            }
        }
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

        // 关键字纯数字时优先按 ID 精确查找，命中即返回单条结果
        if (keyword != null && !keyword.isBlank() && keyword.trim().matches("\\d+")) {
            try {
                Integer id = Integer.valueOf(keyword.trim());
                Optional<EnterpriseAgent> exact = enterpriseAgentRepository.findById(id);
                if (exact.isPresent()) {
                    return List.of(toLookupItem(exact.get()));
                }
            } catch (NumberFormatException ignore) {
                // 数字溢出 Integer 时降级到 LIKE 搜索
            }
        }

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
            list.add(toLookupItem(ea));
        }
        return list;
    }

    private Map<String, Object> toLookupItem(EnterpriseAgent ea) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", ea.getId());
        item.put("userId", ea.getUserId());
        item.put("companyName", ea.getCompanyName());
        item.put("legalPerson", ea.getLegalPerson());
        item.put("contactName", ea.getContactName());
        return item;
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
        if (request.getLicenseNo() != null) {
            InstitutionServiceImpl.validateLicenseNo(request.getLicenseNo());
            ent.setLicenseNo(request.getLicenseNo());
        }
        if (request.getLegalPerson() != null) ent.setLegalPerson(request.getLegalPerson());
        if (request.getIndustry() != null) ent.setIndustry(request.getIndustry());
        if (request.getCompanySize() != null) ent.setCompanySize(request.getCompanySize());
        if (request.getBio() != null) ent.setBio(request.getBio());
        if (request.getContactName() != null) ent.setContactName(request.getContactName());
        if (request.getContactPhone() != null) ent.setContactPhone(request.getContactPhone());
        if (request.getPostCode() != null) ent.setPostCode(request.getPostCode());
        if (request.getProvinceId() != null) ent.setProvinceId(request.getProvinceId());
        if (request.getCityId() != null) ent.setCityId(request.getCityId());
        if (request.getDistrictId() != null) ent.setDistrictId(request.getDistrictId());
        if (request.getTownId() != null) ent.setTownId(request.getTownId());
        if (request.getAddress() != null) ent.setAddress(request.getAddress());
        if (request.getQualificationDocUrl() != null) ent.setQualificationDocUrl(request.getQualificationDocUrl());

        // 协议：首次同意时回写时间与版本
        if (Boolean.TRUE.equals(request.getAgreementSigned())) {
            if (ent.getAgreementSignedAt() == null) {
                ent.setAgreementSignedAt(LocalDateTime.now());
            }
            String version = request.getAgreementVersion();
            ent.setAgreementVersion(version != null && !version.isBlank()
                    ? version : DEFAULT_AGREEMENT_VERSION);
        }

        return enterpriseAgentRepository.save(ent);
    }

    // ---- 变更日志辅助 ----

    static final Map<String, String> EA_FIELD_LABELS = Map.<String, String>ofEntries(
            Map.entry("companyName", "公司名称"),
            Map.entry("licenseNo", "营业执照号"),
            Map.entry("legalPerson", "法定代表人"),
            Map.entry("industry", "所属行业"),
            Map.entry("companySize", "公司规模"),
            Map.entry("bio", "公司简介"),
            Map.entry("contactName", "联系人姓名"),
            Map.entry("contactPhone", "联系电话"),
            Map.entry("address", "公司地址"),
            Map.entry("qualificationDocUrl", "营业执照")
    );

    private static Map<String, String> toFieldMap(EnterpriseAgent e) {
        if (e == null) return Map.of();
        Map<String, String> m = new HashMap<>();
        putIf(m, "companyName", e.getCompanyName());
        putIf(m, "licenseNo", e.getLicenseNo());
        putIf(m, "legalPerson", e.getLegalPerson());
        putIf(m, "industry", e.getIndustry());
        putIf(m, "companySize", e.getCompanySize());
        putIf(m, "bio", e.getBio());
        putIf(m, "contactName", e.getContactName());
        putIf(m, "contactPhone", e.getContactPhone());
        putIf(m, "address", e.getAddress());
        putIf(m, "qualificationDocUrl", e.getQualificationDocUrl());
        return m;
    }

    private static void putIf(Map<String, String> m, String key, Object val) {
        if (val != null) m.put(key, String.valueOf(val));
    }
}
