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
import com.taoke.user.service.RoleApplicationChangeLogService;
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
    private final RoleApplicationChangeLogService changeLogService;

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

    /**
     * 分页查询经纪公司申请列表。
     * <p>待审核（含资料重审）置顶，组内按最近提交时间倒序 — 排序由 findApplications 内部 JPQL 固定。</p>
     */
    public PageResult<AdminEnterpriseAgentApplicationVO> listApplications(
            AdminEnterpriseAgentApplicationQuery query) {
        PageRequest pageable = PageRequest.of(query.getPage() - 1, query.getSize());

        Page<UserRole> rolePage = userRoleService.findApplications(
                BusinessRole.Code.ENTERPRISE_AGENT, query.getStatus(), pageable);

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
            vo.setReapplying(Boolean.TRUE.equals(ur.getReapplying()));
            vo.setRejectReason(ur.getRejectReason());
            vo.setCreatedAt(ur.getCreatedAt());
            vo.setUpdatedAt(ur.getUpdatedAt());
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
                // 经纪公司 ID（正式档案唯一标识）：角色审核通过后才展示
                if (ur.getStatus() == 1) {
                    vo.setEnterpriseAgentId(ea.getId());
                }
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

    /**
     * 获取经纪公司申请详情。
     */
    public AdminApplicationDetailVO getApplicationDetail(Integer userId) {
        UserRole userRole = userRoleService.findByUserId(userId).stream()
                .filter(ur -> BusinessRole.Code.ENTERPRISE_AGENT.equals(ur.getRole()))
                .findFirst()
                .orElseThrow(() -> new com.taoke.common.exception.BusinessException(com.taoke.common.exception.ErrorCode.NOT_FOUND, "未找到该用户的经纪公司申请记录"));

        EnterpriseAgent ea = enterpriseAgentService.findByUserIds(List.of(userId)).stream()
                .findFirst().orElse(null);
        User user = userService.findAllByIds(List.of(userId)).stream().findFirst().orElse(null);

        AdminApplicationDetailVO vo = new AdminApplicationDetailVO();
        vo.setId(userRole.getId());
        vo.setUserId(userId);
        vo.setPhone(user != null ? user.getPhone() : null);
        vo.setNickname(user != null ? user.getNickname() : null);
        vo.setRole(BusinessRole.Code.ENTERPRISE_AGENT);
        vo.setRoleName(BusinessRole.ENTERPRISE_AGENT.getLabel());
        vo.setStatus(userRole.getStatus());
        vo.setReapplying(Boolean.TRUE.equals(userRole.getReapplying()));
        vo.setRejectReason(userRole.getRejectReason());
        vo.setCreatedAt(userRole.getCreatedAt());
        vo.setApprovedAt(userRole.getApprovedAt());
        vo.setEntityId(ea != null ? ea.getId() : null);
        vo.setApplicantName(ea != null ? ea.getCompanyName() : null);

        java.util.Set<String> changedFields = vo.getReapplying()
                ? changeLogService.getLastChangedFields(userId, BusinessRole.Code.ENTERPRISE_AGENT)
                : java.util.Set.of();

        java.util.List<AdminApplicationFieldVO> fields = new java.util.ArrayList<>();
        if (ea != null) {
            fields.add(AdminTrainerService.fieldRef("companyName", "公司名称", ea.getCompanyName(), changedFields));
            fields.add(AdminTrainerService.fieldRef("licenseNo", "营业执照号", ea.getLicenseNo(), changedFields));
            fields.add(AdminTrainerService.fieldRef("legalPerson", "法定代表人", ea.getLegalPerson(), changedFields));
            fields.add(AdminTrainerService.fieldRef("industry", "所属行业", ea.getIndustry(), changedFields));
            fields.add(AdminTrainerService.fieldRef("companySize", "公司规模", ea.getCompanySize(), changedFields));
            fields.add(AdminTrainerService.fieldRef("bio", "公司简介", ea.getBio(), changedFields));
            fields.add(AdminTrainerService.fieldRef("contactName", "联系人姓名", ea.getContactName(), changedFields));
            fields.add(AdminTrainerService.fieldRef("contactPhone", "联系电话", ea.getContactPhone(), changedFields));
            fields.add(AdminTrainerService.fieldRef("address", "公司地址", ea.getAddress(), changedFields));
            fields.add(AdminTrainerService.fieldRef("qualificationDocUrl", "营业执照", ea.getQualificationDocUrl(), changedFields));
        }
        vo.setFields(fields);
        return vo;
    }
}
