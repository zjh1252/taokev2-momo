package com.taoke.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.admin.dto.rolecert.AdminAgentWorkCertVO;
import com.taoke.admin.dto.rolecert.AdminBuyerRealNameCertVO;
import com.taoke.admin.dto.rolecert.AdminBuyerWorkCertVO;
import com.taoke.admin.dto.rolecert.AdminEnterpriseAgentCertVO;
import com.taoke.admin.dto.rolecert.AdminInstitutionCompanyInfoVO;
import com.taoke.admin.dto.rolecert.AdminRoleCertQuery;
import com.taoke.common.dto.PageResult;
import com.taoke.user.api.RoleCertificationAdminService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.Agent;
import com.taoke.user.entity.AgentWorkExperience;
import com.taoke.user.entity.EnterpriseAgent;
import com.taoke.user.entity.EnterpriseBuyer;
import com.taoke.user.entity.EnterpriseBuyerWorkExperience;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.User;
import com.taoke.user.repository.AgentRepository;
import com.taoke.user.repository.EnterpriseBuyerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 后台 — 三角色身份信息认证审核编排服务。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminRoleCertificationService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final RoleCertificationAdminService adminService;
    private final AgentRepository agentRepository;
    private final EnterpriseBuyerRepository enterpriseBuyerRepository;
    private final UserService userService;

    // ==================== 经纪人 — 工作认证 ====================

    public PageResult<AdminAgentWorkCertVO> listAgentWorkExperiences(AdminRoleCertQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<AgentWorkExperience> page = adminService.pageAgentWorkExperiences(query.getStatus(), pageable);
        List<AgentWorkExperience> records = page.getContent();
        if (records.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> agentIds = records.stream().map(AgentWorkExperience::getAgentId).distinct().toList();
        Map<Integer, Agent> agentMap = agentRepository.findAllById(agentIds).stream()
                .collect(Collectors.toMap(Agent::getId, Function.identity()));
        Map<Integer, User> userMap = loadUsers(agentMap.values().stream().map(Agent::getUserId).toList());

        List<AdminAgentWorkCertVO> voList = records.stream().map(w -> {
            AdminAgentWorkCertVO vo = new AdminAgentWorkCertVO();
            vo.setId(w.getId());
            vo.setAgentId(w.getAgentId());
            vo.setCompanyName(w.getCompanyName());
            vo.setPosition(w.getPosition());
            vo.setStartDate(w.getStartDate());
            vo.setEndDate(w.getEndDate());
            vo.setJobDescription(w.getJobDescription());
            vo.setProofFile(w.getProofFile());
            vo.setStatus(w.getStatus());
            vo.setRejectReason(w.getRejectReason());
            vo.setSubmittedAt(w.getSubmittedAt() == null ? w.getCreatedAt() : w.getSubmittedAt());
            vo.setAuditedAt(w.getAuditedAt());
            Agent a = agentMap.get(w.getAgentId());
            if (a != null) {
                vo.setUserId(a.getUserId());
                vo.setRealName(a.getRealName());
                User u = userMap.get(a.getUserId());
                if (u != null) {
                    vo.setPhone(u.getPhone());
                    vo.setNickname(u.getNickname());
                    if (vo.getRealName() == null || vo.getRealName().isBlank()) {
                        vo.setRealName(u.getRealName());
                    }
                }
            }
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(),
                applySearch(voList, query.getSearch(),
                        v -> List.of(safe(v.getPhone()), safe(v.getNickname()), safe(v.getRealName()),
                                safe(v.getCompanyName()), safe(v.getPosition()))));
    }

    public void auditAgentWorkExperience(Integer recordId, boolean approved, String reason) {
        adminService.auditAgentWorkExperience(recordId, approved, reason);
    }

    // ==================== 经纪公司 — 资质认证 ====================

    public PageResult<AdminEnterpriseAgentCertVO> listEnterpriseAgentCerts(AdminRoleCertQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "certSubmittedAt", "id"));
        Page<EnterpriseAgent> page = adminService.pageEnterpriseAgentCerts(query.getStatus(), pageable);
        List<EnterpriseAgent> records = page.getContent();
        if (records.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        Map<Integer, User> userMap = loadUsers(records.stream().map(EnterpriseAgent::getUserId).toList());

        List<AdminEnterpriseAgentCertVO> voList = records.stream().map(ea -> {
            AdminEnterpriseAgentCertVO vo = new AdminEnterpriseAgentCertVO();
            vo.setEnterpriseAgentId(ea.getId());
            vo.setUserId(ea.getUserId());
            vo.setCompanyName(ea.getCompanyName());
            vo.setCertLogoUrl(ea.getCertLogoUrl());
            vo.setQualificationDocUrl(ea.getQualificationDocUrl());
            vo.setStatus(ea.getCertStatus());
            vo.setRejectReason(ea.getCertRejectReason());
            vo.setSubmittedAt(ea.getCertSubmittedAt());
            vo.setAuditedAt(ea.getCertAuditedAt());
            User u = userMap.get(ea.getUserId());
            if (u != null) {
                vo.setPhone(u.getPhone());
                vo.setNickname(u.getNickname());
            }
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(),
                applySearch(voList, query.getSearch(),
                        v -> List.of(safe(v.getPhone()), safe(v.getNickname()), safe(v.getCompanyName()))));
    }

    public void auditEnterpriseAgentCert(Integer enterpriseAgentId, boolean approved, String reason) {
        adminService.auditEnterpriseAgentCert(enterpriseAgentId, approved, reason);
    }

    // ==================== 培训机构 — 公司资料 ====================

    public PageResult<AdminInstitutionCompanyInfoVO> listInstitutionCompanyInfo(AdminRoleCertQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "companyInfoSubmittedAt", "id"));
        Page<Institution> page = adminService.pageInstitutionCompanyInfo(query.getStatus(), pageable);
        List<Institution> records = page.getContent();
        if (records.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        Map<Integer, User> userMap = loadUsers(records.stream().map(Institution::getUserId).toList());

        List<AdminInstitutionCompanyInfoVO> voList = records.stream().map(inst -> {
            AdminInstitutionCompanyInfoVO vo = new AdminInstitutionCompanyInfoVO();
            vo.setInstitutionId(inst.getId());
            vo.setUserId(inst.getUserId());
            vo.setOrgName(inst.getOrgName());
            vo.setLogoUrl(inst.getLogoUrl());
            vo.setCompanyNature(inst.getCompanyNature());
            vo.setWebsite(inst.getWebsite());
            vo.setCompanySize(inst.getCompanySize());
            vo.setAnnualRevenue(inst.getAnnualRevenue());
            vo.setRegisteredCapital(inst.getRegisteredCapital());
            vo.setProvinceId(inst.getProvinceId());
            vo.setCityId(inst.getCityId());
            vo.setDistrictId(inst.getDistrictId());
            vo.setTownId(inst.getTownId());
            vo.setAddress(inst.getAddress());
            vo.setPostCode(inst.getPostCode());
            vo.setMaxCommissionRate(inst.getMaxCommissionRate());
            vo.setPaymentMethods(parseStringList(inst.getPaymentMethods()));
            vo.setHasCopyrightCourse(inst.getHasCopyrightCourse());
            vo.setBankCardNo(inst.getBankCardNo());
            vo.setBankName(inst.getBankName());
            vo.setBankBranch(inst.getBankBranch());
            vo.setLicenseDocUrl(inst.getLicenseDocUrl());
            vo.setLicenseNo(inst.getLicenseNo());
            vo.setStatus(inst.getCompanyInfoStatus());
            vo.setRejectReason(inst.getCompanyInfoRejectReason());
            vo.setSubmittedAt(inst.getCompanyInfoSubmittedAt());
            vo.setAuditedAt(inst.getCompanyInfoAuditedAt());
            User u = userMap.get(inst.getUserId());
            if (u != null) {
                vo.setPhone(u.getPhone());
                vo.setNickname(u.getNickname());
            }
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(),
                applySearch(voList, query.getSearch(),
                        v -> List.of(safe(v.getPhone()), safe(v.getNickname()), safe(v.getOrgName()))));
    }

    public void auditInstitutionCompanyInfo(Integer institutionId, boolean approved, String reason) {
        adminService.auditInstitutionCompanyInfo(institutionId, approved, reason);
    }

    // ==================== 企业采购方 — 实名认证 ====================

    public PageResult<AdminBuyerRealNameCertVO> listBuyerRealName(AdminRoleCertQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "realNameSubmittedAt", "id"));
        Page<EnterpriseBuyer> page = adminService.pageBuyerRealName(query.getStatus(), pageable);
        List<EnterpriseBuyer> records = page.getContent();
        if (records.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        Map<Integer, User> userMap = loadUsers(records.stream().map(EnterpriseBuyer::getUserId).toList());

        List<AdminBuyerRealNameCertVO> voList = records.stream().map(b -> {
            AdminBuyerRealNameCertVO vo = new AdminBuyerRealNameCertVO();
            vo.setBuyerId(b.getId());
            vo.setUserId(b.getUserId());
            vo.setCompanyName(b.getCompanyName());
            vo.setRealName(b.getContactName());
            vo.setIdCardNo(b.getIdCardNo());
            vo.setIdCardFront(b.getIdCardFront());
            vo.setIdCardBack(b.getIdCardBack());
            vo.setStatus(b.getRealNameStatus());
            vo.setRejectReason(b.getRealNameRejectReason());
            vo.setSubmittedAt(b.getRealNameSubmittedAt());
            vo.setAuditedAt(b.getRealNameAuditedAt());
            User u = userMap.get(b.getUserId());
            if (u != null) {
                vo.setPhone(u.getPhone());
                vo.setNickname(u.getNickname());
                if (vo.getRealName() == null || vo.getRealName().isBlank()) {
                    vo.setRealName(u.getRealName());
                }
            }
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(),
                applySearch(voList, query.getSearch(),
                        v -> List.of(safe(v.getPhone()), safe(v.getNickname()), safe(v.getRealName()),
                                safe(v.getCompanyName()))));
    }

    public void auditBuyerRealName(Integer buyerId, boolean approved, String reason) {
        adminService.auditBuyerRealName(buyerId, approved, reason);
    }

    // ==================== 企业采购方 — 工作认证 ====================

    public PageResult<AdminBuyerWorkCertVO> listBuyerWorkExperiences(AdminRoleCertQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        Page<EnterpriseBuyerWorkExperience> page = adminService.pageBuyerWorkExperiences(query.getStatus(), pageable);
        List<EnterpriseBuyerWorkExperience> records = page.getContent();
        if (records.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> buyerIds = records.stream().map(EnterpriseBuyerWorkExperience::getBuyerId).distinct().toList();
        Map<Integer, EnterpriseBuyer> buyerMap = enterpriseBuyerRepository.findAllById(buyerIds).stream()
                .collect(Collectors.toMap(EnterpriseBuyer::getId, Function.identity()));
        Map<Integer, User> userMap = loadUsers(buyerMap.values().stream().map(EnterpriseBuyer::getUserId).toList());

        List<AdminBuyerWorkCertVO> voList = records.stream().map(w -> {
            AdminBuyerWorkCertVO vo = new AdminBuyerWorkCertVO();
            vo.setId(w.getId());
            vo.setBuyerId(w.getBuyerId());
            vo.setWorkCompanyName(w.getCompanyName());
            vo.setPosition(w.getPosition());
            vo.setStartDate(w.getStartDate());
            vo.setEndDate(w.getEndDate());
            vo.setJobDescription(w.getJobDescription());
            vo.setProofFile(w.getProofFile());
            vo.setStatus(w.getStatus());
            vo.setRejectReason(w.getRejectReason());
            vo.setSubmittedAt(w.getSubmittedAt() == null ? w.getCreatedAt() : w.getSubmittedAt());
            vo.setAuditedAt(w.getAuditedAt());
            EnterpriseBuyer b = buyerMap.get(w.getBuyerId());
            if (b != null) {
                vo.setUserId(b.getUserId());
                vo.setCompanyName(b.getCompanyName());
                vo.setContactName(b.getContactName());
                User u = userMap.get(b.getUserId());
                if (u != null) {
                    vo.setPhone(u.getPhone());
                    vo.setNickname(u.getNickname());
                }
            }
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(),
                applySearch(voList, query.getSearch(),
                        v -> List.of(safe(v.getPhone()), safe(v.getNickname()), safe(v.getCompanyName()),
                                safe(v.getContactName()), safe(v.getWorkCompanyName()), safe(v.getPosition()))));
    }

    public void auditBuyerWorkExperience(Integer recordId, boolean approved, String reason) {
        adminService.auditBuyerWorkExperience(recordId, approved, reason);
    }

    // ==================== 工具方法 ====================

    private Map<Integer, User> loadUsers(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) return Map.of();
        return userService.findAllByIds(userIds.stream().distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            log.warn("解析字符串数组 JSON 失败: {}", json, ex);
            return Collections.emptyList();
        }
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static <T> List<T> applySearch(List<T> list, String search, Function<T, List<String>> fields) {
        if (search == null || search.isBlank()) return list;
        String kw = search.trim().toLowerCase();
        return list.stream()
                .filter(item -> fields.apply(item).stream()
                        .anyMatch(f -> f.toLowerCase().contains(kw)))
                .toList();
    }
}
