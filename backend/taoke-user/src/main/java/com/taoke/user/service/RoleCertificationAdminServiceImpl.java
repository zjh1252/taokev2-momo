package com.taoke.user.service;

import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.user.AgentWorkCertificationAuditedEvent;
import com.taoke.common.events.user.EnterpriseAgentCertificationAuditedEvent;
import com.taoke.common.events.user.InstitutionCompanyInfoAuditedEvent;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.RoleCertificationAdminService;
import com.taoke.user.entity.Agent;
import com.taoke.user.entity.AgentWorkExperience;
import com.taoke.user.entity.EnterpriseAgent;
import com.taoke.user.entity.Institution;
import com.taoke.user.repository.AgentRepository;
import com.taoke.user.repository.AgentWorkExperienceRepository;
import com.taoke.user.repository.EnterpriseAgentRepository;
import com.taoke.user.repository.InstitutionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 三角色身份信息认证 — 后台审核实现。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleCertificationAdminServiceImpl implements RoleCertificationAdminService {

    private final AgentRepository agentRepository;
    private final AgentWorkExperienceRepository agentWorkRepository;
    private final EnterpriseAgentRepository enterpriseAgentRepository;
    private final InstitutionRepository institutionRepository;
    private final EventPublisher eventPublisher;

    // ==================== 经纪人 — 工作认证 ====================

    @Override
    public Page<AgentWorkExperience> pageAgentWorkExperiences(Integer status, Pageable pageable) {
        if (status != null) {
            return agentWorkRepository.findByStatus(status, pageable);
        }
        return agentWorkRepository.findAll(pageable);
    }

    @Transactional
    @Override
    public void auditAgentWorkExperience(Integer recordId, boolean approved, String reason) {
        AgentWorkExperience entity = agentWorkRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "工作记录不存在"));
        if (!approved && (reason == null || reason.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "驳回原因不能为空");
        }
        entity.setStatus(approved ? 2 : 3);
        entity.setRejectReason(approved ? null : reason);
        entity.setAuditedAt(LocalDateTime.now());
        agentWorkRepository.save(entity);

        Agent agent = agentRepository.findById(entity.getAgentId()).orElse(null);
        if (agent != null) {
            eventPublisher.publish(new AgentWorkCertificationAuditedEvent(
                    approved, agent.getUserId(), entity.getId(),
                    entity.getCompanyName(), reason));
        }
    }

    // ==================== 经纪公司 — 资质认证 ====================

    @Override
    public Page<EnterpriseAgent> pageEnterpriseAgentCerts(Integer status, Pageable pageable) {
        Specification<EnterpriseAgent> spec = (root, cq, cb) -> {
            Predicate notNull = cb.isNotNull(root.get("certStatus"));
            if (status != null) {
                return cb.and(notNull, cb.equal(root.get("certStatus"), status));
            }
            return notNull;
        };
        return enterpriseAgentRepository.findAll(spec, pageable);
    }

    @Transactional
    @Override
    public void auditEnterpriseAgentCert(Integer enterpriseAgentId, boolean approved, String reason) {
        EnterpriseAgent ea = enterpriseAgentRepository.findById(enterpriseAgentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "经纪公司不存在"));
        if (ea.getCertStatus() == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "公司尚未提交资质认证");
        }
        if (!approved && (reason == null || reason.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "驳回原因不能为空");
        }
        ea.setCertStatus(approved ? 2 : 3);
        ea.setCertRejectReason(approved ? null : reason);
        ea.setCertAuditedAt(LocalDateTime.now());
        enterpriseAgentRepository.save(ea);

        eventPublisher.publish(new EnterpriseAgentCertificationAuditedEvent(
                approved, ea.getUserId(), ea.getId(),
                ea.getCompanyName(), reason));
    }

    // ==================== 培训机构 — 公司资料 ====================

    @Override
    public Page<Institution> pageInstitutionCompanyInfo(Integer status, Pageable pageable) {
        Specification<Institution> spec = (root, cq, cb) -> {
            Predicate notNull = cb.isNotNull(root.get("companyInfoStatus"));
            if (status != null) {
                return cb.and(notNull, cb.equal(root.get("companyInfoStatus"), status));
            }
            return notNull;
        };
        return institutionRepository.findAll(spec, pageable);
    }

    @Transactional
    @Override
    public void auditInstitutionCompanyInfo(Integer institutionId, boolean approved, String reason) {
        Institution inst = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "机构不存在"));
        if (inst.getCompanyInfoStatus() == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "机构尚未提交公司资料");
        }
        if (!approved && (reason == null || reason.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "驳回原因不能为空");
        }
        inst.setCompanyInfoStatus(approved ? 2 : 3);
        inst.setCompanyInfoRejectReason(approved ? null : reason);
        inst.setCompanyInfoAuditedAt(LocalDateTime.now());
        institutionRepository.save(inst);

        eventPublisher.publish(new InstitutionCompanyInfoAuditedEvent(
                approved, inst.getUserId(), inst.getId(),
                inst.getOrgName(), reason));
    }
}
