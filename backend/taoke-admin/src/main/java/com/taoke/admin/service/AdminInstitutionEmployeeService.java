package com.taoke.admin.service;

import com.taoke.admin.dto.*;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.InstitutionEmployeeService;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.InstitutionEmployee;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 后台机构员工管理编排服务 — 列表 + 申请审核。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Service
@RequiredArgsConstructor
public class AdminInstitutionEmployeeService {

    private final InstitutionEmployeeService institutionEmployeeService;
    private final InstitutionService institutionService;
    private final UserService userService;
    private final UserRoleService userRoleService;
    private final RoleApplyService roleApplyService;

    /**
     * 分页查询机构员工列表
     */
    public PageResult<AdminInstitutionEmployeeVO> listEmployees(AdminInstitutionEmployeeQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<InstitutionEmployee> page = institutionEmployeeService.searchForAdmin(query.getSearch(), pageable);
        List<InstitutionEmployee> employees = page.getContent();

        if (employees.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        // 批量查关联机构名称
        Set<Integer> orgIds = employees.stream()
                .map(InstitutionEmployee::getOrgId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Integer, String> orgNameMap = new HashMap<>();
        if (!orgIds.isEmpty()) {
            institutionService.findByIds(orgIds).forEach(inst ->
                    orgNameMap.put(inst.getId(), inst.getOrgName()));
        }

        List<AdminInstitutionEmployeeVO> voList = employees.stream().map(emp -> {
            AdminInstitutionEmployeeVO vo = new AdminInstitutionEmployeeVO();
            vo.setId(emp.getId());
            vo.setUserId(emp.getUserId());
            vo.setOrgId(emp.getOrgId());
            vo.setOrgName(orgNameMap.getOrDefault(emp.getOrgId(), null));
            vo.setPosition(emp.getPosition());
            vo.setDepartment(emp.getDepartment());
            vo.setCreatedAt(emp.getCreatedAt());
            return vo;
        }).toList();

        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 分页查询机构员工申请列表
     */
    public PageResult<AdminInstitutionEmployeeApplicationVO> listApplications(
            AdminInstitutionEmployeeApplicationQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<UserRole> rolePage;
        if (query.getStatus() != null) {
            rolePage = userRoleService.findByRoleAndStatus(
                    BusinessRole.Code.INSTITUTION_EMPLOYEE, query.getStatus(), pageable);
        } else {
            rolePage = userRoleService.findByRole(BusinessRole.Code.INSTITUTION_EMPLOYEE, pageable);
        }

        List<UserRole> userRoles = rolePage.getContent();
        if (userRoles.isEmpty()) {
            return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> userIds = userRoles.stream().map(UserRole::getUserId).distinct().toList();
        Map<Integer, User> userMap = userService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Integer, InstitutionEmployee> empMap = institutionEmployeeService.findByUserIds(userIds).stream()
                .collect(Collectors.toMap(InstitutionEmployee::getUserId, Function.identity()));

        // 批量查机构名称
        Set<Integer> orgIds = empMap.values().stream()
                .map(InstitutionEmployee::getOrgId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Integer, String> orgNameMap = new HashMap<>();
        if (!orgIds.isEmpty()) {
            institutionService.findByIds(orgIds).forEach(inst ->
                    orgNameMap.put(inst.getId(), inst.getOrgName()));
        }

        List<AdminInstitutionEmployeeApplicationVO> voList = userRoles.stream().map(ur -> {
            AdminInstitutionEmployeeApplicationVO vo = new AdminInstitutionEmployeeApplicationVO();
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

            InstitutionEmployee emp = empMap.get(ur.getUserId());
            if (emp != null) {
                vo.setPosition(emp.getPosition());
                vo.setDepartment(emp.getDepartment());
                vo.setOrgName(orgNameMap.getOrDefault(emp.getOrgId(), null));
            }

            return vo;
        }).toList();

        List<AdminInstitutionEmployeeApplicationVO> filtered = voList;
        if (query.getSearch() != null && !query.getSearch().isBlank()) {
            String kw = query.getSearch().trim().toLowerCase();
            filtered = voList.stream().filter(vo ->
                    (vo.getPhone() != null && vo.getPhone().contains(kw)) ||
                    (vo.getNickname() != null && vo.getNickname().toLowerCase().contains(kw)) ||
                    (vo.getOrgName() != null && vo.getOrgName().toLowerCase().contains(kw))
            ).toList();
        }

        return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), filtered);
    }

    public void approveApplication(Integer userId) {
        roleApplyService.approve(userId, BusinessRole.Code.INSTITUTION_EMPLOYEE);
    }

    public void rejectApplication(Integer userId, String reason) {
        roleApplyService.reject(userId, BusinessRole.Code.INSTITUTION_EMPLOYEE, reason);
    }
}
