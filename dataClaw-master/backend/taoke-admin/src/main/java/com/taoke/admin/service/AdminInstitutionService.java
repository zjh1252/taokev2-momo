package com.taoke.admin.service;

import com.taoke.admin.dto.*;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.Institution;
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
 * 后台机构管理编排服务 — 机构列表 + 申请审核 + 培训协会标识。
 *
 * @author Fangxinxin
 * @date 2026-04-09 10:00
 */
@Service
@RequiredArgsConstructor
public class AdminInstitutionService {

    private final InstitutionService institutionService;
    private final UserService userService;
    private final UserRoleService userRoleService;
    private final RoleApplyService roleApplyService;

    /**
     * 分页查询机构列表
     */
    public PageResult<AdminInstitutionVO> listInstitutions(AdminInstitutionQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<Institution> page = institutionService.searchForAdmin(query.getSearch(), query.getStatus(), pageable);
        List<Institution> institutions = page.getContent();

        if (institutions.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<AdminInstitutionVO> voList = institutions.stream().map(this::toInstitutionVO).toList();
        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 分页查询机构申请列表
     */
    public PageResult<AdminInstitutionApplicationVO> listApplications(AdminInstitutionApplicationQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<UserRole> rolePage;
        if (query.getStatus() != null) {
            rolePage = userRoleService.findByRoleAndStatus(BusinessRole.Code.INSTITUTION, query.getStatus(), pageable);
        } else {
            rolePage = userRoleService.findByRole(BusinessRole.Code.INSTITUTION, pageable);
        }

        List<UserRole> userRoles = rolePage.getContent();
        if (userRoles.isEmpty()) {
            return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> userIds = userRoles.stream().map(UserRole::getUserId).distinct().toList();
        Map<Integer, User> userMap = userService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Integer, Institution> instMap = institutionService.findByUserIds(userIds).stream()
                .collect(Collectors.toMap(Institution::getUserId, Function.identity()));

        List<AdminInstitutionApplicationVO> voList = userRoles.stream().map(ur -> {
            AdminInstitutionApplicationVO vo = new AdminInstitutionApplicationVO();
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

            Institution inst = instMap.get(ur.getUserId());
            if (inst != null) {
                vo.setOrgName(inst.getOrgName());
                vo.setLogoUrl(inst.getLogoUrl());
                vo.setContactName(inst.getContactName());
                vo.setContactPhone(inst.getContactPhone());
            }

            return vo;
        }).toList();

        // 搜索过滤（内存过滤，因为涉及跨表字段）
        List<AdminInstitutionApplicationVO> filtered = voList;
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

    /**
     * 审核通过机构申请
     */
    public void approveApplication(Integer userId) {
        roleApplyService.approve(userId, BusinessRole.Code.INSTITUTION);
    }

    /**
     * 驳回机构申请
     */
    public void rejectApplication(Integer userId, String reason) {
        roleApplyService.reject(userId, BusinessRole.Code.INSTITUTION, reason);
    }

    /**
     * 设为/取消培训协会
     */
    public void setAssociation(Integer institutionId, boolean association) {
        institutionService.setAssociation(institutionId, association);
    }

    private AdminInstitutionVO toInstitutionVO(Institution inst) {
        AdminInstitutionVO vo = new AdminInstitutionVO();
        vo.setId(inst.getId());
        vo.setUserId(inst.getUserId());
        vo.setOrgName(inst.getOrgName());
        vo.setOrgType(inst.getOrgType());
        vo.setStatus(inst.getStatus());
        vo.setScore(inst.getScore());
        vo.setIsCertified(inst.getIsCertified());
        vo.setIsRecommended(inst.getIsRecommended());
        vo.setAssociation(inst.getAssociation());
        vo.setViewCount(inst.getViewCount());
        vo.setContactName(inst.getContactName());
        vo.setContactPhone(inst.getContactPhone());
        vo.setCreatedAt(inst.getCreatedAt());
        return vo;
    }
}
