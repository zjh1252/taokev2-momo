package com.taoke.admin.service;

import com.taoke.admin.dto.*;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.AgentService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.Agent;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 后台经纪人管理编排服务 — 列表 + 申请审核。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Service
@RequiredArgsConstructor
public class AdminAgentService {

    private final AgentService agentService;
    private final UserService userService;
    private final UserRoleService userRoleService;
    private final RoleApplyService roleApplyService;

    public PageResult<AdminAgentVO> listAgents(AdminAgentQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<Agent> page = agentService.searchForAdmin(query.getSearch(), pageable);
        List<Agent> agents = page.getContent();

        if (agents.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<AdminAgentVO> voList = agents.stream().map(agent -> {
            AdminAgentVO vo = new AdminAgentVO();
            vo.setId(agent.getId());
            vo.setUserId(agent.getUserId());
            vo.setBio(agent.getBio());
            vo.setSpecialties(agent.getSpecialties());
            vo.setServiceCityIds(agent.getServiceCityIds());
            vo.setCreatedAt(agent.getCreatedAt());
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    public PageResult<AdminAgentApplicationVO> listApplications(AdminAgentApplicationQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<UserRole> rolePage;
        if (query.getStatus() != null) {
            rolePage = userRoleService.findByRoleAndStatus(BusinessRole.Code.AGENT, query.getStatus(), pageable);
        } else {
            rolePage = userRoleService.findByRole(BusinessRole.Code.AGENT, pageable);
        }

        List<UserRole> userRoles = rolePage.getContent();
        if (userRoles.isEmpty()) {
            return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> userIds = userRoles.stream().map(UserRole::getUserId).distinct().toList();
        Map<Integer, User> userMap = userService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Integer, Agent> agentMap = agentService.findByUserIds(userIds).stream()
                .collect(Collectors.toMap(Agent::getUserId, Function.identity()));

        List<AdminAgentApplicationVO> voList = userRoles.stream().map(ur -> {
            AdminAgentApplicationVO vo = new AdminAgentApplicationVO();
            vo.setId(ur.getId());
            vo.setUserId(ur.getUserId());
            vo.setStatus(ur.getStatus());
            vo.setRejectReason(ur.getRejectReason());
            vo.setCreatedAt(ur.getCreatedAt());
            vo.setApprovedAt(ur.getApprovedAt());

            User user = userMap.get(ur.getUserId());
            if (user != null) {
                vo.setPhone(user.getPhone());
                vo.setNickname(user.getNickname());
            }

            Agent agent = agentMap.get(ur.getUserId());
            if (agent != null) {
                vo.setBio(agent.getBio());
                vo.setSpecialties(agent.getSpecialties());
            }

            return vo;
        }).toList();

        List<AdminAgentApplicationVO> filtered = voList;
        if (query.getSearch() != null && !query.getSearch().isBlank()) {
            String kw = query.getSearch().trim().toLowerCase();
            filtered = voList.stream().filter(vo ->
                    (vo.getPhone() != null && vo.getPhone().contains(kw)) ||
                    (vo.getNickname() != null && vo.getNickname().toLowerCase().contains(kw))
            ).toList();
        }

        return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), filtered);
    }

    public void approveApplication(Integer userId) {
        roleApplyService.approve(userId, BusinessRole.Code.AGENT);
    }

    public void rejectApplication(Integer userId, String reason) {
        roleApplyService.reject(userId, BusinessRole.Code.AGENT, reason);
    }
}
