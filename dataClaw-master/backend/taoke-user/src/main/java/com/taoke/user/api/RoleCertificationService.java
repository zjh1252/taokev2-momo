package com.taoke.user.api;

import com.taoke.user.dto.role.cert.AgentWorkCertRequest;
import com.taoke.user.dto.role.cert.AgentWorkCertVO;
import com.taoke.user.dto.role.cert.EnterpriseAgentCertRequest;
import com.taoke.user.dto.role.cert.EnterpriseAgentCertVO;
import com.taoke.user.dto.role.cert.InstitutionCompanyInfoRequest;
import com.taoke.user.dto.role.cert.InstitutionCompanyInfoVO;

import java.util.List;

/**
 * 三角色身份信息认证 — C 端能力契约。
 *
 * <ul>
 *   <li>AGENT — 工作认证（多记录，每条独立审核）</li>
 *   <li>ENTERPRISE_AGENT — 资质认证（公司Logo + 营业执照单条整体审核）</li>
 *   <li>INSTITUTION — 公司资料（单条整体审核，复用机构地址）</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
public interface RoleCertificationService {

    // ==================== 经纪人 — 工作认证 ====================

    List<AgentWorkCertVO> listAgentWorkCerts(Integer userId);

    AgentWorkCertVO createAgentWorkCert(Integer userId, AgentWorkCertRequest request);

    AgentWorkCertVO updateAgentWorkCert(Integer userId, Integer id, AgentWorkCertRequest request);

    void deleteAgentWorkCert(Integer userId, Integer id);

    // ==================== 经纪公司 — 资质认证 ====================

    EnterpriseAgentCertVO getEnterpriseAgentCert(Integer userId);

    void submitEnterpriseAgentCert(Integer userId, EnterpriseAgentCertRequest request);

    // ==================== 培训机构 — 公司资料 ====================

    InstitutionCompanyInfoVO getInstitutionCompanyInfo(Integer userId);

    void submitInstitutionCompanyInfo(Integer userId, InstitutionCompanyInfoRequest request);
}
