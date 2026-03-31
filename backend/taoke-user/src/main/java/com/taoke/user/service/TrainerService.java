package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.dto.trainer.TrainerRequest;
import com.taoke.user.dto.trainer.TrainerResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Trainer;
import com.taoke.user.mapper.TrainerMapper;
import com.taoke.user.repository.TrainerRepository;
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
    private final TrainerMapper trainerMapper;
    private final RoleApplyService roleApplyService;

    public TrainerResponse getByUserId(Integer userId) {
        Trainer trainer = trainerRepository.findByUserId(userId).orElse(null);
        return trainer == null ? null : trainerMapper.toResponse(trainer);
    }

    /**
     * 保存专家档案（有则更新、无则创建，要求角色已生效）
     */
    @Transactional
    public TrainerResponse save(Integer userId, TrainerRequest request) {
        return trainerMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    /**
     * 申请成为专家 — 提交扩展信息并创建待审核角色记录
     */
    @Transactional
    public void apply(Integer userId, TrainerRequest request) {
        roleApplyService.apply(userId, BusinessRole.Code.TRAINER);
        saveOrUpdateExtension(userId, request);
    }

    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.TRAINER);
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
}
