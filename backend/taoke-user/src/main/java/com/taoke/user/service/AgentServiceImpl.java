package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.AgentService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.agent.AgentRequest;
import com.taoke.user.dto.agent.AgentResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.Agent;
import com.taoke.user.mapper.AgentMapper;
import com.taoke.user.repository.AgentRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 专家经纪人档案服务 — AGENT 角色扩展信息管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Service
@RequiredArgsConstructor
public class AgentServiceImpl implements AgentService {

    private final AgentRepository agentRepository;
    private final AgentMapper agentMapper;
    private final RoleApplyService roleApplyService;

    @Override
    public AgentResponse getByUserId(Integer userId) {
        Agent agent = agentRepository.findByUserId(userId).orElse(null);
        return agent == null ? null : agentMapper.toResponse(agent);
    }

    /**
     * 保存专家经纪人档案（有则更新、无则创建，要求角色已生效）
     */
    @Transactional
    @Override
    public AgentResponse save(Integer userId, AgentRequest request) {
        return agentMapper.toResponse(saveOrUpdateExtension(userId, request));
    }

    /**
     * 申请成为专家经纪人 — 提交扩展信息并创建待审核角色记录
     */
    @Transactional
    @Override
    public void apply(Integer userId, AgentRequest request) {
        roleApplyService.apply(userId, BusinessRole.Code.AGENT);
        saveOrUpdateExtension(userId, request);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.AGENT);
    }

    @Override
    public Page<Agent> searchForAdmin(String search, Pageable pageable) {
        Specification<Agent> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim() + "%";
                predicates.add(cb.like(root.get("bio"), pattern));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return agentRepository.findAll(spec, pageable);
    }

    @Override
    public List<Agent> findByUserIds(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return agentRepository.findByUserIdIn(userIds);
    }

    private Agent saveOrUpdateExtension(Integer userId, AgentRequest request) {
        Agent agent = agentRepository.findByUserId(userId).orElseGet(() -> {
            Agent a = new Agent();
            a.setUserId(userId);
            return a;
        });

        if (request.getBio() != null) agent.setBio(request.getBio());
        if (request.getSpecialties() != null) agent.setSpecialties(request.getSpecialties());
        if (request.getServiceCityIds() != null) agent.setServiceCityIds(request.getServiceCityIds());

        return agentRepository.save(agent);
    }
}
