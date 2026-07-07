package com.taoke.user.api;

import com.taoke.user.dto.role.cert.AgentWorkCertRequest;
import com.taoke.user.dto.role.cert.AgentWorkCertVO;
import com.taoke.user.dto.role.cert.BuyerWorkCertVO;
import com.taoke.user.dto.role.cert.EnterpriseAgentCertRequest;
import com.taoke.user.dto.role.cert.EnterpriseAgentCertVO;
import com.taoke.user.dto.role.cert.InstitutionCompanyInfoRequest;
import com.taoke.user.dto.role.cert.InstitutionCompanyInfoVO;
import com.taoke.user.dto.trainer.cert.RealNameCertRequest;
import com.taoke.user.dto.trainer.cert.RealNameCertResponse;

import java.util.List;

/**
 * 三角色身份信息认证 — C 端能力契约。
 *
 * <ul>
 *   <li>AGENT — 工作认证（多记录，每条独立审核）</li>
 *   <li>ENTERPRISE_BUYER — 实名认证 + 工作认证</li>
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

    // ==================== 企业采购方 — 实名认证 ====================

    RealNameCertResponse getBuyerRealName(Integer userId);

    void submitBuyerRealName(Integer userId, RealNameCertRequest request);

    // ==================== 企业采购方 — 工作认证 ====================

    List<BuyerWorkCertVO> listBuyerWorkCerts(Integer userId);

    BuyerWorkCertVO createBuyerWorkCert(Integer userId, AgentWorkCertRequest request);

    BuyerWorkCertVO updateBuyerWorkCert(Integer userId, Integer id, AgentWorkCertRequest request);

    void deleteBuyerWorkCert(Integer userId, Integer id);
}
