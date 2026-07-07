package com.taoke.user.api;

import com.taoke.user.entity.AgentWorkExperience;
import com.taoke.user.entity.EnterpriseAgent;
import com.taoke.user.entity.EnterpriseBuyer;
import com.taoke.user.entity.EnterpriseBuyerWorkExperience;
import com.taoke.user.entity.Institution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 三角色身份信息认证 — 后台管理能力契约。
 *
 * <p>仅返回原始实体，VO 组装由 admin 模块完成。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
public interface RoleCertificationAdminService {

    // ==================== 经纪人 — 工作认证（按记录） ====================

    Page<AgentWorkExperience> pageAgentWorkExperiences(Integer status, Pageable pageable);

    void auditAgentWorkExperience(Integer recordId, boolean approved, String reason);

    // ==================== 经纪公司 — 资质认证（按公司） ====================

    Page<EnterpriseAgent> pageEnterpriseAgentCerts(Integer status, Pageable pageable);

    void auditEnterpriseAgentCert(Integer enterpriseAgentId, boolean approved, String reason);

    // ==================== 培训机构 — 公司资料（按机构） ====================

    Page<Institution> pageInstitutionCompanyInfo(Integer status, Pageable pageable);

    void auditInstitutionCompanyInfo(Integer institutionId, boolean approved, String reason);

    // ==================== 企业采购方 — 实名认证 ====================

    Page<EnterpriseBuyer> pageBuyerRealName(Integer status, Pageable pageable);

    void auditBuyerRealName(Integer buyerId, boolean approved, String reason);

    // ==================== 企业采购方 — 工作认证（按记录） ====================

    Page<EnterpriseBuyerWorkExperience> pageBuyerWorkExperiences(Integer status, Pageable pageable);

    void auditBuyerWorkExperience(Integer recordId, boolean approved, String reason);
}
