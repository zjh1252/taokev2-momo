package com.taoke.admin.service;

import com.taoke.admin.dto.*;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.user.api.EnterpriseBuyerService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.EnterpriseBuyer;
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
 * 后台企业采购方管理编排服务 — 企业采购方列表 + 申请审核。
 *
 * @author Fangxinxin
 * @date 2026-04-09 17:00
 */
@Service
@RequiredArgsConstructor
public class AdminEnterpriseBuyerService {

    private final EnterpriseBuyerService enterpriseBuyerService;
    private final UserService userService;
    private final UserRoleService userRoleService;
    private final RoleApplyService roleApplyService;

    /**
     * 分页查询企业采购方列表
     */
    public PageResult<AdminEnterpriseBuyerVO> listEnterpriseBuyers(AdminEnterpriseBuyerQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<EnterpriseBuyer> page = enterpriseBuyerService.searchForAdmin(query.getSearch(), pageable);
        List<EnterpriseBuyer> buyers = page.getContent();

        if (buyers.isEmpty()) {
            return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<AdminEnterpriseBuyerVO> voList = buyers.stream().map(this::toBuyerVO).toList();
        return PageResult.of(page.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 分页查询企业采购方申请列表
     */
    public PageResult<AdminEnterpriseBuyerApplicationVO> listApplications(AdminEnterpriseBuyerApplicationQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<UserRole> rolePage;
        if (query.getStatus() != null) {
            rolePage = userRoleService.findByRoleAndStatus(BusinessRole.Code.ENTERPRISE_BUYER, query.getStatus(), pageable);
        } else {
            rolePage = userRoleService.findByRole(BusinessRole.Code.ENTERPRISE_BUYER, pageable);
        }

        List<UserRole> userRoles = rolePage.getContent();
        if (userRoles.isEmpty()) {
            return PageResult.of(rolePage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> userIds = userRoles.stream().map(UserRole::getUserId).distinct().toList();
        Map<Integer, User> userMap = userService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Integer, EnterpriseBuyer> buyerMap = enterpriseBuyerService.findByUserIds(userIds).stream()
                .collect(Collectors.toMap(EnterpriseBuyer::getUserId, Function.identity()));

        List<AdminEnterpriseBuyerApplicationVO> voList = userRoles.stream().map(ur -> {
            AdminEnterpriseBuyerApplicationVO vo = new AdminEnterpriseBuyerApplicationVO();
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

            EnterpriseBuyer buyer = buyerMap.get(ur.getUserId());
            if (buyer != null) {
                vo.setCompanyName(buyer.getCompanyName());
                vo.setContactName(buyer.getContactName());
                vo.setContactPhone(buyer.getContactPhone());
            }

            return vo;
        }).toList();

        List<AdminEnterpriseBuyerApplicationVO> filtered = voList;
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

    /**
     * 审核通过企业采购方申请
     */
    public void approveApplication(Integer userId) {
        roleApplyService.approve(userId, BusinessRole.Code.ENTERPRISE_BUYER);
    }

    /**
     * 驳回企业采购方申请
     */
    public void rejectApplication(Integer userId, String reason) {
        roleApplyService.reject(userId, BusinessRole.Code.ENTERPRISE_BUYER, reason);
    }

    private AdminEnterpriseBuyerVO toBuyerVO(EnterpriseBuyer buyer) {
        AdminEnterpriseBuyerVO vo = new AdminEnterpriseBuyerVO();
        vo.setId(buyer.getId());
        vo.setUserId(buyer.getUserId());
        vo.setCompanyName(buyer.getCompanyName());
        vo.setIndustry(buyer.getIndustry());
        vo.setCompanySize(buyer.getCompanySize());
        vo.setContactName(buyer.getContactName());
        vo.setContactPhone(buyer.getContactPhone());
        vo.setCreatedAt(buyer.getCreatedAt());
        return vo;
    }
}
