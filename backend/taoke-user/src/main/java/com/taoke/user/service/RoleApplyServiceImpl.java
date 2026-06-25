package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.user.ApplyPassedEvent;
import com.taoke.common.events.user.ApplyRejectedEvent;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.UserRole;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
public class RoleApplyServiceImpl implements RoleApplyService {

    private final UserRoleRepository userRoleRepository;
    private final EventPublisher eventPublisher;

    private static final Map<Integer, String> STATUS_TEXT = Map.of(
            1, "生效",
            2, "待审核",
            3, "已驳回",
            4, "已禁用"
    );

    /**
     * 提交角色申请（新申请 / 驳回后重新提交 / 已生效用户主动重审）。
     * <p>
     * 状态流转：
     * <ul>
     *   <li>无记录 → 新建 status=2</li>
     *   <li>status=3（驳回）→ 改回 status=2，清空 rejectReason</li>
     *   <li>status=1（已生效）→ status 保持 1 + reapplying=1，进入「资料重审」流程，
     *       重审期间原身份继续生效（{@code SecurityUserService} 仍按 status=1 加载该角色），
     *       审核通过/驳回后由管理端清除 reapplying 标记</li>
     *   <li>status=2 / 重审中 → 允许覆盖更新已提交资料（保持 status=2 或 reapplying=1）</li>
     *   <li>status=4 → 抛异常（角色已被禁用）</li>
     * </ul>
     *
     * @param userId   当前用户 ID
     * @param roleCode 角色编码（如 TRAINER）
     */
    @Transactional
    @Override
    public boolean apply(Integer userId, String roleCode) {
        UserRole userRole = userRoleRepository.findByUserIdAndRole(userId, roleCode).orElse(null);

        if (userRole == null) {
            userRole = new UserRole();
            userRole.setUserId(userId);
            userRole.setRole(roleCode);
            userRole.setStatus(2);
            userRole.setReapplying(false);
            userRoleRepository.save(userRole);
            return false;
        }

        switch (userRole.getStatus()) {
            case 3 -> {
                userRole.setStatus(2);
                userRole.setRejectReason(null);
                userRole.setReapplying(false);
                userRoleRepository.save(userRole);
                return false;
            }
            case 1 -> {
                // 已生效角色重新提交资料 → 资料重审，原身份保持可用
                userRole.setReapplying(true);
                userRole.setRejectReason(null);
                userRoleRepository.save(userRole);
                return true;
            }
            case 2 -> {
                // 待审核期间允许继续完善并覆盖提交，保持 status=2
                userRole.setRejectReason(null);
                userRoleRepository.save(userRole);
                return false;
            }
            case 4 -> throw new BusinessException(ErrorCode.ROLE_DISABLED);
            default -> throw new BusinessException(ErrorCode.INTERNAL_ERROR, "未知的角色状态: " + userRole.getStatus());
        }
    }

    /**
     * 申请并自动通过 — 无需资质审核的角色（ENTERPRISE_BUYER / ASSISTANT）。
     * <p>
     * 状态流转：
     * <ul>
     *   <li>无记录 → 直接新建 status=1（生效）</li>
     *   <li>status=3（驳回）→ 直接改为 status=1，并清空 rejectReason</li>
     *   <li>status=2（待审核）→ 直接改为 status=1（兼容旧数据）</li>
     *   <li>status=1（已生效）→ 抛 {@link ErrorCode#ROLE_ALREADY_ACTIVE}</li>
     *   <li>status=4（已禁用）→ 抛 {@link ErrorCode#ROLE_DISABLED}</li>
     * </ul>
     * 角色生效后统一发布 {@link ApplyPassedEvent}，由 UserEventListener 触发通知等副作用。
     *
     * @param userId   用户 ID
     * @param roleCode 角色编码
     */
    @Transactional
    @Override
    public void applyAndAutoApprove(Integer userId, String roleCode) {
        UserRole userRole = userRoleRepository.findByUserIdAndRole(userId, roleCode).orElse(null);

        if (userRole == null) {
            userRole = new UserRole();
            userRole.setUserId(userId);
            userRole.setRole(roleCode);
        } else {
            switch (userRole.getStatus()) {
                case 1 -> throw new BusinessException(ErrorCode.ROLE_ALREADY_ACTIVE);
                case 4 -> throw new BusinessException(ErrorCode.ROLE_DISABLED);
                default -> { /* 2/3 → 复用记录，下面统一改为 1 */ }
            }
        }
        userRole.setStatus(1);
        userRole.setRejectReason(null);
        userRole.setReapplying(false);
        userRole.setApprovedAt(LocalDateTime.now());
        userRoleRepository.save(userRole);

        eventPublisher.publish(new ApplyPassedEvent(roleCode, userId));
    }

    /**
     * 审核通过角色申请（管理端调用）。
     * <p>
     * 状态流转：
     * <ul>
     *   <li>status=2（待审核）→ status=1（生效）</li>
     *   <li>status=1 且 reapplying=1（资料重审）→ 清除 reapplying，身份保持生效</li>
     * </ul>
     * 并发布 {@link ApplyPassedEvent}。
     *
     * @param userId   目标用户 ID
     * @param roleCode 角色编码
     */
    @Transactional
    @Override
    public void approve(Integer userId, String roleCode) {
        UserRole userRole = userRoleRepository.findByUserIdAndRole(userId, roleCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "未找到角色申请记录"));

        boolean reapplying = userRole.getStatus() == 1 && Boolean.TRUE.equals(userRole.getReapplying());
        if (userRole.getStatus() != 2 && !reapplying) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "当前状态不可审核: " + STATUS_TEXT.getOrDefault(userRole.getStatus(), "未知"));
        }

        userRole.setStatus(1);
        userRole.setReapplying(false);
        userRole.setApprovedAt(LocalDateTime.now());
        userRoleRepository.save(userRole);

        // 发布领域事件
        eventPublisher.publish(new ApplyPassedEvent(roleCode, userId));
    }

    /**
     * 驳回角色申请（管理端调用）。
     * <p>
     * 状态流转：
     * <ul>
     *   <li>status=2（待审核）→ status=3（已驳回）</li>
     *   <li>status=1 且 reapplying=1（资料重审）→ 仅清除 reapplying 并记录原因，原身份保持生效</li>
     * </ul>
     *
     * @param userId     目标用户 ID
     * @param roleCode   角色编码
     * @param reason     驳回原因
     */
    @Transactional
    @Override
    public void reject(Integer userId, String roleCode, String reason) {
        UserRole userRole = userRoleRepository.findByUserIdAndRole(userId, roleCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "未找到角色申请记录"));

        boolean reapplying = userRole.getStatus() == 1 && Boolean.TRUE.equals(userRole.getReapplying());
        if (userRole.getStatus() != 2 && !reapplying) {
            throw new BusinessException(ErrorCode.PARAM_INVALID,
                    "当前状态不可驳回: " + STATUS_TEXT.getOrDefault(userRole.getStatus(), "未知"));
        }

        if (reapplying) {
            // 重审驳回：保留原已生效身份，仅记录驳回原因
            userRole.setReapplying(false);
        } else {
            userRole.setStatus(3);
        }
        userRole.setRejectReason(reason);
        userRoleRepository.save(userRole);

        eventPublisher.publish(new ApplyRejectedEvent(roleCode, userId, reason));
    }

    /**
     * 查询用户某角色的申请状态。
     *
     * @param userId   当前用户 ID
     * @param roleCode 角色编码
     * @return 申请状态；如果从未申请过则返回 null
     */
    @Override
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
        boolean reapplying = userRole.getStatus() == 1 && Boolean.TRUE.equals(userRole.getReapplying());
        resp.setStatusText(reapplying ? "资料审核中（原身份可用）"
                : STATUS_TEXT.getOrDefault(userRole.getStatus(), "未知"));
        resp.setReapplying(reapplying);
        resp.setRejectReason(userRole.getRejectReason());
        resp.setAppliedAt(userRole.getCreatedAt());
        resp.setApprovedAt(userRole.getApprovedAt());
        return resp;
    }
}
