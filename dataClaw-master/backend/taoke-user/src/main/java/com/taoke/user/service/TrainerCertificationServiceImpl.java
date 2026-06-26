package com.taoke.user.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.TrainerCertificationService;
import com.taoke.user.dto.trainer.TrainerEducationDTO;
import com.taoke.user.dto.trainer.TrainerWorkExperienceDTO;
import com.taoke.user.dto.trainer.cert.*;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerEducation;
import com.taoke.user.entity.TrainerWorkExperience;
import com.taoke.user.entity.User;
import com.taoke.user.mapper.TrainerMapper;
import com.taoke.user.repository.TrainerEducationRepository;
import com.taoke.user.repository.TrainerRepository;
import com.taoke.user.repository.TrainerWorkExperienceRepository;
import com.taoke.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * 专家四维度资质认证 — C 端实现。
 *
 * <p>状态枚举：</p>
 * <ul>
 *   <li>实名认证 / 专业认证：NULL=未提交 1=待审核 2=已通过 3=已驳回</li>
 *   <li>学历 / 工作认证（按记录）：1=待审核 2=已通过 3=已驳回</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TrainerCertificationServiceImpl implements TrainerCertificationService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final int MAX_PROFESSIONAL_FILES = 20;

    private final TrainerRepository trainerRepository;
    private final UserRepository userRepository;
    private final TrainerEducationRepository educationRepository;
    private final TrainerWorkExperienceRepository workExperienceRepository;
    private final TrainerMapper trainerMapper;

    // ==================== 实名认证 ====================

    @Override
    public RealNameCertResponse getRealName(Integer userId) {
        Trainer trainer = requireTrainer(userId);
        User user = requireUser(userId);

        RealNameCertResponse resp = new RealNameCertResponse();
        resp.setRealName(user.getRealName());
        resp.setIdCardNo(trainer.getIdCardNo());
        resp.setIdCardFront(trainer.getIdCardFront());
        resp.setIdCardBack(trainer.getIdCardBack());
        resp.setStatus(trainer.getRealNameStatus());
        resp.setRejectReason(trainer.getRealNameRejectReason());
        resp.setSubmittedAt(trainer.getRealNameSubmittedAt());
        resp.setAuditedAt(trainer.getRealNameAuditedAt());
        return resp;
    }

    @Transactional
    @Override
    public void submitRealName(Integer userId, RealNameCertRequest request) {
        Trainer trainer = requireTrainer(userId);
        User user = requireUser(userId);

        // 真实姓名同步写入 sys_users.real_name，供基础信息页展示
        user.setRealName(request.getRealName());
        userRepository.save(user);

        trainer.setName(request.getRealName());
        trainer.setIdCardNo(request.getIdCardNo());
        trainer.setIdCardFront(request.getIdCardFront());
        trainer.setIdCardBack(request.getIdCardBack());
        trainer.setRealNameStatus(1);
        trainer.setRealNameRejectReason(null);
        trainer.setRealNameSubmittedAt(LocalDateTime.now());
        // 注意：审核时间 audited_at 不在提交时清空，便于前端展示「上次审核于…」
        trainerRepository.save(trainer);
    }

    // ==================== 专业认证 ====================

    @Override
    public ProfessionalCertResponse getProfessional(Integer userId) {
        Trainer trainer = requireTrainer(userId);

        ProfessionalCertResponse resp = new ProfessionalCertResponse();
        resp.setFiles(parseFiles(trainer.getCertificationFiles()));
        resp.setStatus(trainer.getProfessionalStatus());
        resp.setRejectReason(trainer.getProfessionalRejectReason());
        resp.setSubmittedAt(trainer.getProfessionalSubmittedAt());
        resp.setAuditedAt(trainer.getProfessionalAuditedAt());
        return resp;
    }

    @Transactional
    @Override
    public void submitProfessional(Integer userId, ProfessionalCertRequest request) {
        Trainer trainer = requireTrainer(userId);

        List<String> cleaned = request.getFiles().stream()
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .limit(MAX_PROFESSIONAL_FILES)
                .toList();
        if (cleaned.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请至少上传一份专业认证附件");
        }
        trainer.setCertificationFiles(serializeFiles(cleaned));
        trainer.setProfessionalStatus(1);
        trainer.setProfessionalRejectReason(null);
        trainer.setProfessionalSubmittedAt(LocalDateTime.now());
        trainerRepository.save(trainer);
    }

    // ==================== 学历认证 ====================

    @Override
    public List<TrainerEducationDTO> listEducations(Integer userId) {
        Integer trainerId = requireTrainer(userId).getId();
        List<TrainerEducation> records = educationRepository.findByTrainerIdOrderBySortOrder(trainerId);
        return trainerMapper.toEducationDTOList(records);
    }

    @Transactional
    @Override
    public TrainerEducationDTO createEducation(Integer userId, EducationCertRequest request) {
        Integer trainerId = requireTrainer(userId).getId();
        TrainerEducation entity = new TrainerEducation();
        entity.setTrainerId(trainerId);
        applyEducation(entity, request);
        entity.setStatus(1);
        entity.setRejectReason(null);
        entity.setAuditedAt(null);
        return trainerMapper.toEducationDTO(educationRepository.save(entity));
    }

    @Transactional
    @Override
    public TrainerEducationDTO updateEducation(Integer userId, Integer id, EducationCertRequest request) {
        Integer trainerId = requireTrainer(userId).getId();
        TrainerEducation entity = educationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "学历记录不存在"));
        if (!entity.getTrainerId().equals(trainerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作他人记录");
        }
        applyEducation(entity, request);
        // 重新提交后回到「待审核」
        entity.setStatus(1);
        entity.setRejectReason(null);
        return trainerMapper.toEducationDTO(educationRepository.save(entity));
    }

    @Transactional
    @Override
    public void deleteEducation(Integer userId, Integer id) {
        Integer trainerId = requireTrainer(userId).getId();
        TrainerEducation entity = educationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "学历记录不存在"));
        if (!entity.getTrainerId().equals(trainerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权删除他人记录");
        }
        educationRepository.delete(entity);
    }

    private void applyEducation(TrainerEducation entity, EducationCertRequest req) {
        entity.setHolderName(req.getHolderName());
        entity.setSchoolName(req.getSchoolName());
        entity.setMajor(req.getMajor());
        entity.setDegree(req.getDegree());
        entity.setStartDate(req.getStartDate());
        entity.setEndDate(req.getEndDate());
        entity.setIsGraduated(req.getIsGraduated() == null ? 1 : req.getIsGraduated());
        entity.setProofFile(req.getProofFile());
    }

    // ==================== 工作认证 ====================

    @Override
    public List<TrainerWorkExperienceDTO> listWorkExperiences(Integer userId) {
        Integer trainerId = requireTrainer(userId).getId();
        List<TrainerWorkExperience> records = workExperienceRepository.findByTrainerIdOrderBySortOrder(trainerId);
        return trainerMapper.toWorkExperienceDTOList(records);
    }

    @Transactional
    @Override
    public TrainerWorkExperienceDTO createWorkExperience(Integer userId, WorkCertRequest request) {
        Integer trainerId = requireTrainer(userId).getId();
        TrainerWorkExperience entity = new TrainerWorkExperience();
        entity.setTrainerId(trainerId);
        applyWork(entity, request);
        entity.setStatus(1);
        entity.setRejectReason(null);
        entity.setAuditedAt(null);
        return trainerMapper.toWorkExperienceDTO(workExperienceRepository.save(entity));
    }

    @Transactional
    @Override
    public TrainerWorkExperienceDTO updateWorkExperience(Integer userId, Integer id, WorkCertRequest request) {
        Integer trainerId = requireTrainer(userId).getId();
        TrainerWorkExperience entity = workExperienceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "工作记录不存在"));
        if (!entity.getTrainerId().equals(trainerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作他人记录");
        }
        applyWork(entity, request);
        entity.setStatus(1);
        entity.setRejectReason(null);
        return trainerMapper.toWorkExperienceDTO(workExperienceRepository.save(entity));
    }

    @Transactional
    @Override
    public void deleteWorkExperience(Integer userId, Integer id) {
        Integer trainerId = requireTrainer(userId).getId();
        TrainerWorkExperience entity = workExperienceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "工作记录不存在"));
        if (!entity.getTrainerId().equals(trainerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权删除他人记录");
        }
        workExperienceRepository.delete(entity);
    }

    private void applyWork(TrainerWorkExperience entity, WorkCertRequest req) {
        entity.setCompanyName(req.getCompanyName());
        entity.setPosition(req.getPosition());
        entity.setStartDate(req.getStartDate());
        entity.setEndDate(req.getEndDate());
        entity.setJobDescription(req.getJobDescription());
        entity.setProofFile(req.getProofFile());
    }

    // ==================== 工具方法 ====================

    private Trainer requireTrainer(Integer userId) {
        return trainerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "请先创建专家档案"));
    }

    private User requireUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "用户不存在"));
    }

    private List<String> parseFiles(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            log.warn("解析专业认证附件 JSON 失败: {}", json, ex);
            return Collections.emptyList();
        }
    }

    private String serializeFiles(List<String> files) {
        try {
            return OBJECT_MAPPER.writeValueAsString(files);
        } catch (Exception ex) {
            log.warn("序列化专业认证附件 JSON 失败: {}", files, ex);
            return "[]";
        }
    }
}
