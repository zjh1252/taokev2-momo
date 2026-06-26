package com.taoke.user.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.RoleCertificationService;
import com.taoke.user.dto.role.cert.AgentWorkCertRequest;
import com.taoke.user.dto.role.cert.AgentWorkCertVO;
import com.taoke.user.dto.role.cert.EnterpriseAgentCertRequest;
import com.taoke.user.dto.role.cert.EnterpriseAgentCertVO;
import com.taoke.user.dto.role.cert.InstitutionCompanyInfoRequest;
import com.taoke.user.dto.role.cert.InstitutionCompanyInfoVO;
import com.taoke.user.entity.Agent;
import com.taoke.user.entity.AgentWorkExperience;
import com.taoke.user.entity.EnterpriseAgent;
import com.taoke.user.entity.Institution;
import com.taoke.user.repository.AgentRepository;
import com.taoke.user.repository.AgentWorkExperienceRepository;
import com.taoke.user.repository.EnterpriseAgentRepository;
import com.taoke.user.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * 三角色身份信息认证 — C 端实现。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleCertificationServiceImpl implements RoleCertificationService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final AgentRepository agentRepository;
    private final AgentWorkExperienceRepository agentWorkRepository;
    private final EnterpriseAgentRepository enterpriseAgentRepository;
    private final InstitutionRepository institutionRepository;

    // ==================== 经纪人 — 工作认证 ====================

    @Override
    public List<AgentWorkCertVO> listAgentWorkCerts(Integer userId) {
        Integer agentId = requireAgent(userId).getId();
        return agentWorkRepository.findByAgentIdOrderBySortOrder(agentId).stream()
                .map(this::toAgentWorkVO)
                .toList();
    }

    @Transactional
    @Override
    public AgentWorkCertVO createAgentWorkCert(Integer userId, AgentWorkCertRequest request) {
        Integer agentId = requireAgent(userId).getId();
        AgentWorkExperience entity = new AgentWorkExperience();
        entity.setAgentId(agentId);
        applyAgentWork(entity, request);
        entity.setStatus(1);
        entity.setRejectReason(null);
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setAuditedAt(null);
        return toAgentWorkVO(agentWorkRepository.save(entity));
    }

    @Transactional
    @Override
    public AgentWorkCertVO updateAgentWorkCert(Integer userId, Integer id, AgentWorkCertRequest request) {
        Integer agentId = requireAgent(userId).getId();
        AgentWorkExperience entity = agentWorkRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "工作记录不存在"));
        if (!entity.getAgentId().equals(agentId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作他人记录");
        }
        applyAgentWork(entity, request);
        entity.setStatus(1);
        entity.setRejectReason(null);
        entity.setSubmittedAt(LocalDateTime.now());
        return toAgentWorkVO(agentWorkRepository.save(entity));
    }

    @Transactional
    @Override
    public void deleteAgentWorkCert(Integer userId, Integer id) {
        Integer agentId = requireAgent(userId).getId();
        AgentWorkExperience entity = agentWorkRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "工作记录不存在"));
        if (!entity.getAgentId().equals(agentId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权删除他人记录");
        }
        agentWorkRepository.delete(entity);
    }

    private void applyAgentWork(AgentWorkExperience entity, AgentWorkCertRequest req) {
        entity.setCompanyName(req.getCompanyName());
        entity.setPosition(req.getPosition());
        entity.setStartDate(req.getStartDate());
        entity.setEndDate(req.getEndDate());
        entity.setJobDescription(req.getJobDescription());
        entity.setProofFile(req.getProofFile());
    }

    private AgentWorkCertVO toAgentWorkVO(AgentWorkExperience e) {
        AgentWorkCertVO vo = new AgentWorkCertVO();
        vo.setId(e.getId());
        vo.setCompanyName(e.getCompanyName());
        vo.setPosition(e.getPosition());
        vo.setStartDate(e.getStartDate());
        vo.setEndDate(e.getEndDate());
        vo.setJobDescription(e.getJobDescription());
        vo.setProofFile(e.getProofFile());
        vo.setStatus(e.getStatus());
        vo.setRejectReason(e.getRejectReason());
        vo.setSubmittedAt(e.getSubmittedAt() == null ? e.getCreatedAt() : e.getSubmittedAt());
        vo.setAuditedAt(e.getAuditedAt());
        vo.setSortOrder(e.getSortOrder());
        return vo;
    }

    // ==================== 经纪公司 — 资质认证 ====================

    @Override
    public EnterpriseAgentCertVO getEnterpriseAgentCert(Integer userId) {
        EnterpriseAgent ea = requireEnterpriseAgent(userId);
        EnterpriseAgentCertVO vo = new EnterpriseAgentCertVO();
        vo.setCertLogoUrl(ea.getCertLogoUrl());
        vo.setQualificationDocUrl(ea.getQualificationDocUrl());
        vo.setStatus(ea.getCertStatus());
        vo.setRejectReason(ea.getCertRejectReason());
        vo.setSubmittedAt(ea.getCertSubmittedAt());
        vo.setAuditedAt(ea.getCertAuditedAt());
        return vo;
    }

    @Transactional
    @Override
    public void submitEnterpriseAgentCert(Integer userId, EnterpriseAgentCertRequest request) {
        EnterpriseAgent ea = requireEnterpriseAgent(userId);
        ea.setCertLogoUrl(request.getCertLogoUrl());
        ea.setQualificationDocUrl(request.getQualificationDocUrl());
        ea.setCertStatus(1);
        ea.setCertRejectReason(null);
        ea.setCertSubmittedAt(LocalDateTime.now());
        enterpriseAgentRepository.save(ea);
    }

    // ==================== 培训机构 — 公司资料 ====================

    @Override
    public InstitutionCompanyInfoVO getInstitutionCompanyInfo(Integer userId) {
        Institution inst = requireInstitution(userId);
        InstitutionCompanyInfoVO vo = new InstitutionCompanyInfoVO();
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
        return vo;
    }

    @Transactional
    @Override
    public void submitInstitutionCompanyInfo(Integer userId, InstitutionCompanyInfoRequest request) {
        Institution inst = requireInstitution(userId);
        inst.setLogoUrl(request.getLogoUrl());
        inst.setCompanyNature(request.getCompanyNature());
        inst.setWebsite(request.getWebsite());
        inst.setCompanySize(request.getCompanySize());
        inst.setAnnualRevenue(request.getAnnualRevenue());
        inst.setRegisteredCapital(request.getRegisteredCapital());
        // 注册地址直接复用机构地址字段
        inst.setProvinceId(request.getProvinceId());
        inst.setCityId(request.getCityId());
        inst.setDistrictId(request.getDistrictId());
        inst.setTownId(request.getTownId() == null ? 0 : request.getTownId());
        inst.setAddress(request.getAddress());
        inst.setPostCode(request.getPostCode() == null ? "" : request.getPostCode());
        inst.setMaxCommissionRate(request.getMaxCommissionRate());
        inst.setPaymentMethods(serializeStringList(request.getPaymentMethods()));
        inst.setHasCopyrightCourse(request.getHasCopyrightCourse() == null ? 0 : request.getHasCopyrightCourse());
        inst.setBankCardNo(request.getBankCardNo());
        inst.setBankName(request.getBankName());
        inst.setBankBranch(request.getBankBranch());
        inst.setLicenseDocUrl(request.getLicenseDocUrl());
        if (request.getLicenseNo() != null && !request.getLicenseNo().isBlank()) {
            if (!request.getLicenseNo().matches("\\d{15}|[A-Z\\d]{18}")) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "营业执照号需为15位纯数字或18位大写统一社会信用代码");
            }
            inst.setLicenseNo(request.getLicenseNo());
        }
        inst.setCompanyInfoStatus(1);
        inst.setCompanyInfoRejectReason(null);
        inst.setCompanyInfoSubmittedAt(LocalDateTime.now());
        institutionRepository.save(inst);
    }

    // ==================== 工具方法 ====================

    private Agent requireAgent(Integer userId) {
        return agentRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "请先创建经纪人档案"));
    }

    private EnterpriseAgent requireEnterpriseAgent(Integer userId) {
        return enterpriseAgentRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "请先创建经纪公司档案"));
    }

    private Institution requireInstitution(Integer userId) {
        return institutionRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "请先创建机构档案"));
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

    private String serializeStringList(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        try {
            return OBJECT_MAPPER.writeValueAsString(list.stream()
                    .filter(s -> s != null && !s.isBlank())
                    .distinct()
                    .toList());
        } catch (Exception ex) {
            log.warn("序列化字符串数组 JSON 失败: {}", list, ex);
            return "[]";
        }
    }
}
