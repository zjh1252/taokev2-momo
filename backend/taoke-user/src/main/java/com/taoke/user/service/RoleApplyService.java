package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.UserRole;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * 通用角色申请服务 — 封装 sys_user_roles 的状态机逻辑。
 * <p>
 * 供给方 6 个角色（TRAINER / AGENT / ASSISTANT / ENTERPRISE_AGENT / INSTITUTION / INSTITUTION_EMPLOYEE）
 * 的入驻申请均通过此服务统一处理 UserRole 记录的创建与状态流转。
 *
 * @author Fangxinxin
 * @date 2026-03-31
 */
@Service
@RequiredArgsConstructor
public class RoleApplyService {

    private final UserRoleRepository userRoleRepository;

    private static final Map<Integer, String> STATUS_TEXT = Map.of(
            1, "生效",
            2, "待审核",
            3, "已驳回",
            4, "已禁用"
    );

    /**
     * 提交角色申请（新申请 / 驳回后重新提交）。
     * <p>
     * 状态流转：
     * <ul>
     *   <li>无记录 → 新建 status=2</li>
     *   <li>status=3（驳回）→ 改回 status=2，清空 rejectReason</li>
     *   <li>status=2 → 抛异常（已有进行中的申请）</li>
     *   <li>status=1 → 抛异常（已拥有该角色）</li>
     *   <li>status=4 → 抛异常（角色已被禁用）</li>
     * </ul>
     *
     * @param userId   当前用户 ID
     * @param roleCode 角色编码（如 TRAINER）
     */
    @Transactional
    public void apply(Integer userId, String roleCode) {
        UserRole userRole = userRoleRepository.findByUserIdAndRole(userId, roleCode).orElse(null);

        if (userRole == null) {
            userRole = new UserRole();
            userRole.setUserId(userId);
            userRole.setRole(roleCode);
            userRole.setStatus(2);
            userRoleRepository.save(userRole);
            return;
        }

        switch (userRole.getStatus()) {
            case 3 -> {
                userRole.setStatus(2);
                userRole.setRejectReason(null);
                userRoleRepository.save(userRole);
            }
            case 2 -> throw new BusinessException(ErrorCode.ROLE_APPLICATION_PENDING);
            case 1 -> throw new BusinessException(ErrorCode.ROLE_ALREADY_ACTIVE);
            case 4 -> throw new BusinessException(ErrorCode.ROLE_DISABLED);
            default -> throw new BusinessException(ErrorCode.INTERNAL_ERROR, "未知的角色状态: " + userRole.getStatus());
        }
    }

    /**
     * 查询用户某角色的申请状态。
     *
     * @param userId   当前用户 ID
     * @param roleCode 角色编码
     * @return 申请状态；如果从未申请过则返回 null
     */
    public RoleApplicationStatusResponse getStatus(Integer userId, String roleCode) {
        UserRole userRole = userRoleRepository.findByUserIdAndRole(userId, roleCode).orElse(null);
        if (userRole == null) {
            return null;
        }

        BusinessRole bizRole = BusinessRole.valueOf(roleCode);

        RoleApplicationStatusResponse resp = new RoleApplicationStatusResponse();
        resp.setRole(roleCode);
        resp.setRoleName(bizRole.getLabel());
        resp.setStatus(userRole.getStatus());
        resp.setStatusText(STATUS_TEXT.getOrDefault(userRole.getStatus(), "未知"));
        resp.setRejectReason(userRole.getRejectReason());
        resp.setAppliedAt(userRole.getCreatedAt());
        resp.setApprovedAt(userRole.getApprovedAt());
        return resp;
    }
}
