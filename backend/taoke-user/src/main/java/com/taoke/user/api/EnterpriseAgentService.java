package com.taoke.user.api;

import com.taoke.user.dto.enterpriseagent.EnterpriseAgentRequest;
import com.taoke.user.dto.enterpriseagent.EnterpriseAgentResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.EnterpriseAgent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

/**
 * 企业代理档案的查询、保存与角色申请能力（按用户维度）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface EnterpriseAgentService {

    EnterpriseAgentResponse getByUserId(Integer userId);

    EnterpriseAgentResponse save(Integer userId, EnterpriseAgentRequest request);

    void apply(Integer userId, EnterpriseAgentRequest request);

    RoleApplicationStatusResponse getApplyStatus(Integer userId);

    /**
     * 后台分页查询经纪公司列表（可选关键词搜索 companyName / contactName / contactPhone）。
     */
    Page<EnterpriseAgent> searchForAdmin(String search, Pageable pageable);

    /**
     * 根据用户 ID 批量查询经纪公司档案。
     */
    List<EnterpriseAgent> findByUserIds(List<Integer> userIds);

    /**
     * 公开下拉/搜索：按 keyword 模糊匹配公司名，仅返回最简字段。
     * <p>用于经纪人申请加入时快速选择目标公司。
     *
     * @param keyword 关键字（可空）
     * @param size    返回条数上限
     */
    List<Map<String, Object>> lookup(String keyword, int size);
}
