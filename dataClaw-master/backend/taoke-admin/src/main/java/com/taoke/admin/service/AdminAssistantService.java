package com.taoke.admin.service;

import com.taoke.admin.dto.*;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.AssistantService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.Assistant;
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
 * 后台助理管理编排服务 — 列表 + 申请审核。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Service
@RequiredArgsConstructor
public class AdminAssistantService {

    private final AssistantService assistantService;
    private final UserService userService;
    private final UserRoleService userRoleService;
    private final RoleApplyService roleApplyService;

    public PageResult<AdminAssistantVO> listAssistants(AdminAssistantQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<Assistant> page = assistantService.searchForAdmin(query.getSearch(), pageable);
        List<Assistant> assistants = page.getContent();

        if (assistants.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<AdminAssistantVO> voList = assistants.stream().map(a -> {
            AdminAssistantVO vo = new AdminAssistantVO();
            vo.setId(a.getId());
            vo.setUserId(a.getUserId());
            vo.setBio(a.getBio());
            vo.setAuthScope(a.getAuthScope());
            vo.setCreatedAt(a.getCreatedAt());
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    public PageResult<AdminAssistantApplicationVO> listApplications(AdminAssistantApplicationQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<UserRole> rolePage;
        if (query.getStatus() != null) {
            rolePage = userRoleService.findByRoleAndStatus(BusinessRole.Code.ASSISTANT, query.getStatus(), pageable);
        } else {
            rolePage = userRoleService.findByRole(BusinessRole.Code.ASSISTANT, pageable);
        }

        List<UserRole> userRoles = rolePage.getContent();
        if (userRoles.isEmpty()) {
            return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> userIds = userRoles.stream().map(UserRole::getUserId).distinct().toList();
        Map<Integer, User> userMap = userService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Integer, Assistant> assistantMap = assistantService.findByUserIds(userIds).stream()
                .collect(Collectors.toMap(Assistant::getUserId, Function.identity()));

        List<AdminAssistantApplicationVO> voList = userRoles.stream().map(ur -> {
            AdminAssistantApplicationVO vo = new AdminAssistantApplicationVO();
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

            Assistant assistant = assistantMap.get(ur.getUserId());
            if (assistant != null) {
                vo.setBio(assistant.getBio());
                vo.setAuthScope(assistant.getAuthScope());
            }

            return vo;
        }).toList();

        List<AdminAssistantApplicationVO> filtered = voList;
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
        roleApplyService.approve(userId, BusinessRole.Code.ASSISTANT);
    }

    public void rejectApplication(Integer userId, String reason) {
        roleApplyService.reject(userId, BusinessRole.Code.ASSISTANT, reason);
    }
}
