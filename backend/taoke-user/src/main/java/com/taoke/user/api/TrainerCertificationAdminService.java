package com.taoke.user.api;

import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerEducation;
import com.taoke.user.entity.TrainerWorkExperience;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 专家四维度资质认证 — 后台管理能力契约。
 * <p>
 * 仅返回原始实体，VO 组装由 admin 模块完成。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
public interface TrainerCertificationAdminService {

    // ==================== 实名认证 ====================

    /** 分页查询实名认证（按提交时间倒序）。status 为 null 时返回所有非 NULL 的状态记录 */
    Page<Trainer> pageRealName(Integer status, Pageable pageable);

    /** 审核实名认证：approved=true 通过；false 驳回（reason 必填） */
    void auditRealName(Integer trainerId, boolean approved, String reason);

    // ==================== 专业认证 ====================

    Page<Trainer> pageProfessional(Integer status, Pageable pageable);

    void auditProfessional(Integer trainerId, boolean approved, String reason);

    // ==================== 学历认证（按记录） ====================

    Page<TrainerEducation> pageEducations(Integer status, Pageable pageable);

    void auditEducation(Integer recordId, boolean approved, String reason);

    // ==================== 工作认证（按记录） ====================

    Page<TrainerWorkExperience> pageWorkExperiences(Integer status, Pageable pageable);

    void auditWorkExperience(Integer recordId, boolean approved, String reason);

    /**
     * 批量计算专家「信得过」认证标签（已通过 status=2 的维度）。
     * 返回 map：trainerId → 标签列表（空列表表示未认证）。
     */
    java.util.Map<Integer, java.util.List<String>> batchTrustedCertLabels(
            java.util.Collection<Trainer> trainers);
}
