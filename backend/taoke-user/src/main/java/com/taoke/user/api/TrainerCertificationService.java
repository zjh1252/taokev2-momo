package com.taoke.user.api;

import com.taoke.user.dto.trainer.cert.*;

import java.util.List;

/**
 * 专家四维度资质认证 — C 端能力契约。
 * <p>
 * 维度：实名认证 / 专业认证 / 学历认证 / 工作认证。
 * 提交后状态置为 1 (待审核)；用户再次提交（实名/专业）会重置为 1。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
public interface TrainerCertificationService {

    // ==================== 实名认证 ====================

    /** 查询当前用户的实名认证信息（未提交时返回 status=null） */
    RealNameCertResponse getRealName(Integer userId);

    /** 提交 / 重新提交实名认证（写入 sys_users.real_name 与 user_trainers 身份证字段） */
    void submitRealName(Integer userId, RealNameCertRequest request);

    // ==================== 专业认证 ====================

    /** 查询专业认证（多附件） */
    ProfessionalCertResponse getProfessional(Integer userId);

    /** 提交 / 重新提交专业认证 */
    void submitProfessional(Integer userId, ProfessionalCertRequest request);

    // ==================== 学历认证（多记录） ====================

    /** 查询当前用户的学历认证记录列表（按 sortOrder 排序） */
    List<com.taoke.user.dto.trainer.TrainerEducationDTO> listEducations(Integer userId);

    /** 新增学历认证记录（status=1） */
    com.taoke.user.dto.trainer.TrainerEducationDTO createEducation(Integer userId, EducationCertRequest request);

    /** 更新学历认证记录（status 重置为 1） */
    com.taoke.user.dto.trainer.TrainerEducationDTO updateEducation(Integer userId, Integer id, EducationCertRequest request);

    /** 删除学历认证记录 */
    void deleteEducation(Integer userId, Integer id);

    // ==================== 工作认证（多记录） ====================

    /** 查询当前用户的工作认证记录列表 */
    List<com.taoke.user.dto.trainer.TrainerWorkExperienceDTO> listWorkExperiences(Integer userId);

    /** 新增工作认证记录（status=1） */
    com.taoke.user.dto.trainer.TrainerWorkExperienceDTO createWorkExperience(Integer userId, WorkCertRequest request);

    /** 更新工作认证记录（status 重置为 1） */
    com.taoke.user.dto.trainer.TrainerWorkExperienceDTO updateWorkExperience(Integer userId, Integer id, WorkCertRequest request);

    /** 删除工作认证记录 */
    void deleteWorkExperience(Integer userId, Integer id);
}
