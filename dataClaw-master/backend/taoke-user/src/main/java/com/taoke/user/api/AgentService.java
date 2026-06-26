package com.taoke.user.api;

import com.taoke.user.dto.agent.AgentRequest;
import com.taoke.user.dto.agent.AgentResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Agent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 经纪人档案与入驻申请相关能力。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface AgentService {

    AgentResponse getByUserId(Integer userId);

    AgentResponse save(Integer userId, AgentRequest request);

    void apply(Integer userId, AgentRequest request);

    RoleApplicationStatusResponse getApplyStatus(Integer userId);

    /**
     * 后台分页查询经纪人列表（可选关键词搜索 bio）。
     */
    Page<Agent> searchForAdmin(String search, Pageable pageable);

    /**
     * 根据用户 ID 批量查询经纪人档案。
     */
    List<Agent> findByUserIds(List<Integer> userIds);
}
