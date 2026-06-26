package com.taoke.user.service;

import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.user.TrainerCertificationAuditedEvent;
import com.taoke.common.events.user.TrainerCertificationAuditedEvent.Dimension;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.TrainerCertificationAdminService;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerEducation;
import com.taoke.user.entity.TrainerWorkExperience;
import com.taoke.user.repository.TrainerEducationRepository;
import com.taoke.user.repository.TrainerRepository;
import com.taoke.user.repository.TrainerWorkExperienceRepository;
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
 * 专家资质认证 — 后台审核实现。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TrainerCertificationAdminServiceImpl implements TrainerCertificationAdminService {

    private final TrainerRepository trainerRepository;
    private final TrainerEducationRepository educationRepository;
    private final TrainerWorkExperienceRepository workExperienceRepository;
    private final EventPublisher eventPublisher;

    // ==================== 实名认证 ====================

    @Override
    public Page<Trainer> pageRealName(Integer status, Pageable pageable) {
        Specification<Trainer> spec = (root, cq, cb) -> {
            Predicate notNull = cb.isNotNull(root.get("realNameStatus"));
            if (status != null) {
                return cb.and(notNull, cb.equal(root.get("realNameStatus"), status));
            }
            return notNull;
        };
        return trainerRepository.findAll(spec, pageable);
    }

    @Transactional
    @Override
    public void auditRealName(Integer trainerId, boolean approved, String reason) {
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "专家不存在"));
        if (trainer.getRealNameStatus() == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "用户尚未提交实名认证");
        }
        if (!approved && (reason == null || reason.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "驳回原因不能为空");
        }
        trainer.setRealNameStatus(approved ? 2 : 3);
        trainer.setRealNameRejectReason(approved ? null : reason);
        trainer.setRealNameAuditedAt(LocalDateTime.now());
        trainerRepository.save(trainer);

        eventPublisher.publish(new TrainerCertificationAuditedEvent(
                Dimension.REAL_NAME, approved, trainer.getUserId(), trainer.getId(),
                trainer.getName(), reason));
    }

    // ==================== 专业认证 ====================

    @Override
    public Page<Trainer> pageProfessional(Integer status, Pageable pageable) {
        Specification<Trainer> spec = (root, cq, cb) -> {
            Predicate notNull = cb.isNotNull(root.get("professionalStatus"));
            if (status != null) {
                return cb.and(notNull, cb.equal(root.get("professionalStatus"), status));
            }
            return notNull;
        };
        return trainerRepository.findAll(spec, pageable);
    }

    @Transactional
    @Override
    public void auditProfessional(Integer trainerId, boolean approved, String reason) {
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "专家不存在"));
        if (trainer.getProfessionalStatus() == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "用户尚未提交专业认证");
        }
        if (!approved && (reason == null || reason.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "驳回原因不能为空");
        }
        trainer.setProfessionalStatus(approved ? 2 : 3);
        trainer.setProfessionalRejectReason(approved ? null : reason);
        trainer.setProfessionalAuditedAt(LocalDateTime.now());
        trainerRepository.save(trainer);

        eventPublisher.publish(new TrainerCertificationAuditedEvent(
                Dimension.PROFESSIONAL, approved, trainer.getUserId(), trainer.getId(),
                trainer.getName(), reason));
    }

    // ==================== 学历认证 ====================

    @Override
    public Page<TrainerEducation> pageEducations(Integer status, Pageable pageable) {
        if (status != null) {
            return educationRepository.findByStatus(status, pageable);
        }
        return educationRepository.findAll(pageable);
    }

    @Transactional
    @Override
    public void auditEducation(Integer recordId, boolean approved, String reason) {
        TrainerEducation entity = educationRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "学历记录不存在"));
        if (!approved && (reason == null || reason.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "驳回原因不能为空");
        }
        entity.setStatus(approved ? 2 : 3);
        entity.setRejectReason(approved ? null : reason);
        entity.setAuditedAt(LocalDateTime.now());
        educationRepository.save(entity);

        Trainer trainer = trainerRepository.findById(entity.getTrainerId()).orElse(null);
        if (trainer != null) {
            eventPublisher.publish(new TrainerCertificationAuditedEvent(
                    Dimension.EDUCATION, approved, trainer.getUserId(), entity.getId(),
                    entity.getSchoolName(), reason));
        }
    }

    // ==================== 工作认证 ====================

    @Override
    public Page<TrainerWorkExperience> pageWorkExperiences(Integer status, Pageable pageable) {
        if (status != null) {
            return workExperienceRepository.findByStatus(status, pageable);
        }
        return workExperienceRepository.findAll(pageable);
    }

    @Transactional
    @Override
    public void auditWorkExperience(Integer recordId, boolean approved, String reason) {
        TrainerWorkExperience entity = workExperienceRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "工作记录不存在"));
        if (!approved && (reason == null || reason.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "驳回原因不能为空");
        }
        entity.setStatus(approved ? 2 : 3);
        entity.setRejectReason(approved ? null : reason);
        entity.setAuditedAt(LocalDateTime.now());
        workExperienceRepository.save(entity);

        Trainer trainer = trainerRepository.findById(entity.getTrainerId()).orElse(null);
        if (trainer != null) {
            eventPublisher.publish(new TrainerCertificationAuditedEvent(
                    Dimension.WORK, approved, trainer.getUserId(), entity.getId(),
                    entity.getCompanyName(), reason));
        }
    }
}
