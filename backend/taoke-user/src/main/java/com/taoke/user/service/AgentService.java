package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.agent.AgentRequest;
import com.taoke.user.dto.agent.AgentResponse;
import com.taoke.user.entity.Agent;
import com.taoke.user.mapper.AgentMapper;
import com.taoke.user.repository.AgentRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 专家经纪人档案服务 — AGENT 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Service
@RequiredArgsConstructor
public class AgentService {

    private final AgentRepository agentRepository;
    private final UserRoleRepository userRoleRepository;
    private final AgentMapper agentMapper;

    public AgentResponse getByUserId(Integer userId) {
        checkRole(userId);
        Agent agent = agentRepository.findByUserId(userId).orElse(null);
        if (agent == null) {
            return null;
        }
        return agentMapper.toResponse(agent);
    }

    /**
     * 保存专家经纪人档案（有则更新、无则创建）
     */
    @Transactional
    public AgentResponse save(Integer userId, AgentRequest request) {
        checkRole(userId);
        Agent agent = agentRepository.findByUserId(userId).orElseGet(() -> {
            Agent a = new Agent();
            a.setUserId(userId);
            return a;
        });

        if (request.getBio() != null) agent.setBio(request.getBio());
        if (request.getSpecialties() != null) agent.setSpecialties(request.getSpecialties());
        if (request.getServiceCityIds() != null) agent.setServiceCityIds(request.getServiceCityIds());

        agent = agentRepository.save(agent);
        return agentMapper.toResponse(agent);
    }

    private void checkRole(Integer userId) {
        if (!userRoleRepository.existsByUserIdAndRole(userId, "AGENT")) {
            throw new BusinessException(ErrorCode.ROLE_NOT_MATCH, "需要 AGENT 角色");
        }
    }
}
