package com.taoke.admin.service;

import com.taoke.admin.dto.*;
import com.taoke.admin.mapper.AdminUserMapper;
import com.taoke.common.dto.PageResult;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 后台用户管理编排服务。
 * <p>
 * 通过 {@code api/} 契约接口访问 taoke-user 能力，不直接依赖 Repository。
 *
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserService userService;
    private final UserRoleService userRoleService;
    private final AdminUserMapper adminUserMapper;

    /**
     * 分页查询用户列表（三段式：条件分页 -> 回表 -> 批量查角色组装）。
     */
    public PageResult<AdminUserVO> listUsers(AdminUserQuery query) {
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<User> userPage = userService.searchUsers(query.getSearch(), query.getStatus(), pageable);
        List<User> users = userPage.getContent();

        if (users.isEmpty()) {
            return PageResult.of(userPage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> userIds = users.stream().map(User::getId).toList();
        Map<Integer, List<UserRole>> roleMap = userRoleService.findByUserIds(userIds)
                .stream()
                .collect(Collectors.groupingBy(UserRole::getUserId));

        List<AdminUserVO> voList = users.stream().map(user -> {
            AdminUserVO vo = adminUserMapper.toVO(user);
            List<UserRole> roles = roleMap.getOrDefault(user.getId(), List.of());
            vo.setRoles(roles.stream().map(adminUserMapper::toRoleItem).toList());
            return vo;
        }).toList();

        return PageResult.of(userPage.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 变更用户状态（冻结/解冻），委托给 UserService。
     */
    public void updateStatus(Integer userId, UpdateUserStatusRequest request) {
        userService.updateStatus(userId, request.getStatus(), request.getFreezeReason());
    }

    /**
     * 获取用户当前持有的平台角色列表。
     */
    public List<UserBusinessRoleVO> getUserRoles(Integer userId) {
        if (!userService.existsById(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");
        }
        return userRoleService.getUserPlatformRoles(userId).stream()
                .map(ur -> new UserBusinessRoleVO(ur.getRole(), ur.getStatus()))
                .toList();
    }

    /**
     * 全量替换用户平台角色：新增的直接生效，多余的移除。
     * <p>仅操作平台角色，不影响用户的业务角色。</p>
     */
    @Transactional
    public List<UserBusinessRoleVO> assignRoles(Integer userId, AssignBusinessRolesRequest request) {
        List<UserRole> result = userRoleService.assignPlatformRoles(userId, request.getRoleCodes());
        return result.stream()
                .map(ur -> new UserBusinessRoleVO(ur.getRole(), ur.getStatus()))
                .toList();
    }
}
