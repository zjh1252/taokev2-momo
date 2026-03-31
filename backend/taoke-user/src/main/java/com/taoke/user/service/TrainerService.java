package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.trainer.TrainerRequest;
import com.taoke.user.dto.trainer.TrainerResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Trainer;
import com.taoke.user.mapper.TrainerMapper;
import com.taoke.user.repository.TrainerRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 专家档案服务 — TRAINER 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Service
@RequiredArgsConstructor
public class TrainerService {

    private final TrainerRepository trainerRepository;
    private final UserRoleRepository userRoleRepository;
    private final TrainerMapper trainerMapper;
    private final RoleApplyService roleApplyService;

    public TrainerResponse getByUserId(Integer userId) {
        checkRole(userId);
        Trainer trainer = trainerRepository.findByUserId(userId).orElse(null);
        return trainer == null ? null : trainerMapper.toResponse(trainer);
    }

    /**
     * 保存专家档案（有则更新、无则创建，要求角色已生效）
     */
    @Transactional
    public TrainerResponse save(Integer userId, TrainerRequest request) {
        checkRole(userId);
        return trainerMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    /**
     * 申请成为专家 — 提交扩展信息并创建待审核角色记录
     */
    @Transactional
    public void apply(Integer userId, TrainerRequest request) {
        roleApplyService.apply(userId, "TRAINER");
        saveOrUpdateExtension(userId, request);
    }

    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, "TRAINER");
    }

    private Trainer saveOrUpdateExtension(Integer userId, TrainerRequest request) {
        Trainer trainer = trainerRepository.findByUserId(userId).orElseGet(() -> {
            Trainer t = new Trainer();
            t.setUserId(userId);
            return t;
        });

        if (request.getTitle() != null) trainer.setTitle(request.getTitle());
        if (request.getBio() != null) trainer.setBio(request.getBio());
        if (request.getSpecialties() != null) trainer.setSpecialties(request.getSpecialties());
        if (request.getExperienceYears() != null) trainer.setExperienceYears(request.getExperienceYears());
        if (request.getEducation() != null) trainer.setEducation(request.getEducation());
        if (request.getQualificationLevel() != null) trainer.setQualificationLevel(request.getQualificationLevel());
        if (request.getHomepageConfig() != null) trainer.setHomepageConfig(request.getHomepageConfig());
        if (request.getServiceCityIds() != null) trainer.setServiceCityIds(request.getServiceCityIds());
        if (request.getContactPreference() != null) trainer.setContactPreference(request.getContactPreference());

        return trainerRepository.save(trainer);
    }

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRoleAndStatus(userId, "TRAINER", 1)) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 TRAINER 角色");
        }
    }
}
