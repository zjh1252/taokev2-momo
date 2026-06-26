package com.taoke.admin.service;

import com.taoke.admin.dto.*;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.EnterpriseAgentService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.EnterpriseAgent;
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
 * 后台经纪公司管理编排服务 — 列表 + 申请审核。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Service
@RequiredArgsConstructor
public class AdminEnterpriseAgentService {

    private final EnterpriseAgentService enterpriseAgentService;
    private final UserService userService;
    private final UserRoleService userRoleService;
    private final RoleApplyService roleApplyService;

    public PageResult<AdminEnterpriseAgentVO> listEnterpriseAgents(AdminEnterpriseAgentQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<EnterpriseAgent> page = enterpriseAgentService.searchForAdmin(query.getSearch(), pageable);
        List<EnterpriseAgent> list = page.getContent();

        if (list.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<AdminEnterpriseAgentVO> voList = list.stream().map(ea -> {
            AdminEnterpriseAgentVO vo = new AdminEnterpriseAgentVO();
            vo.setId(ea.getId());
            vo.setUserId(ea.getUserId());
            vo.setCompanyName(ea.getCompanyName());
            vo.setLicenseNo(ea.getLicenseNo());
            vo.setContactName(ea.getContactName());
            vo.setContactPhone(ea.getContactPhone());
            vo.setIndustry(ea.getIndustry());
            vo.setCompanySize(ea.getCompanySize());
            vo.setCreatedAt(ea.getCreatedAt());
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    public PageResult<AdminEnterpriseAgentApplicationVO> listApplications(
            AdminEnterpriseAgentApplicationQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<UserRole> rolePage;
        if (query.getStatus() != null) {
            rolePage = userRoleService.findByRoleAndStatus(
                    BusinessRole.Code.ENTERPRISE_AGENT, query.getStatus(), pageable);
        } else {
            rolePage = userRoleService.findByRole(BusinessRole.Code.ENTERPRISE_AGENT, pageable);
        }

        List<UserRole> userRoles = rolePage.getContent();
        if (userRoles.isEmpty()) {
            return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> userIds = userRoles.stream().map(UserRole::getUserId).distinct().toList();
        Map<Integer, User> userMap = userService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Integer, EnterpriseAgent> eaMap = enterpriseAgentService.findByUserIds(userIds).stream()
                .collect(Collectors.toMap(EnterpriseAgent::getUserId, Function.identity()));

        List<AdminEnterpriseAgentApplicationVO> voList = userRoles.stream().map(ur -> {
            AdminEnterpriseAgentApplicationVO vo = new AdminEnterpriseAgentApplicationVO();
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

            EnterpriseAgent ea = eaMap.get(ur.getUserId());
            if (ea != null) {
                vo.setCompanyName(ea.getCompanyName());
                vo.setContactName(ea.getContactName());
                vo.setContactPhone(ea.getContactPhone());
            }

            return vo;
        }).toList();

        List<AdminEnterpriseAgentApplicationVO> filtered = voList;
        if (query.getSearch() != null && !query.getSearch().isBlank()) {
            String kw = query.getSearch().trim().toLowerCase();
            filtered = voList.stream().filter(vo ->
                    (vo.getPhone() != null && vo.getPhone().contains(kw)) ||
                    (vo.getNickname() != null && vo.getNickname().toLowerCase().contains(kw)) ||
                    (vo.getCompanyName() != null && vo.getCompanyName().toLowerCase().contains(kw))
            ).toList();
        }

        return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), filtered);
    }

    public void approveApplication(Integer userId) {
        roleApplyService.approve(userId, BusinessRole.Code.ENTERPRISE_AGENT);
    }

    public void rejectApplication(Integer userId, String reason) {
        roleApplyService.reject(userId, BusinessRole.Code.ENTERPRISE_AGENT, reason);
    }
}
