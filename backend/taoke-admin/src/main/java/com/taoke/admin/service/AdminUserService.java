package com.taoke.admin.service;

import com.taoke.admin.dto.*;
import com.taoke.admin.mapper.AdminUserMapper;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.RoleType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.entity.Role;
import com.taoke.user.repository.RoleRepository;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 后台用户管理编排服务。
 * <p>
 * 分页查询仍直接使用 Repository（admin 特有的复合查询），
 * 状态变更委托给 {@link UserService}。
 *
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final AdminUserMapper adminUserMapper;
    private final UserService userService;

    /**
     * 分页查询用户列表（三段式：条件分页 -> 回表 -> 批量查角色组装）。
     */
    public PageResult<AdminUserVO> listUsers(AdminUserQuery query) {
        Specification<User> spec = buildSpec(query);
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<User> userPage = userRepository.findAll(spec, pageable);
        List<User> users = userPage.getContent();

        if (users.isEmpty()) {
            return PageResult.of(userPage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        List<Integer> userIds = users.stream().map(User::getId).toList();
        Map<Integer, List<UserRole>> roleMap = userRoleRepository.findByUserIdIn(userIds)
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
     * 从 sys_roles 表动态获取所有平台角色编码
     */
    private Set<String> getPlatformRoleCodes() {
        return roleRepository.findByRoleType(RoleType.PLATFORM.name()).stream()
                .map(Role::getRoleCode)
                .collect(Collectors.toSet());
    }

    /**
     * 获取用户当前持有的平台角色列表。
     */
    public List<UserBusinessRoleVO> getUserRoles(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");
        }
        Set<String> platformCodes = getPlatformRoleCodes();
        return userRoleRepository.findByUserId(userId).stream()
                .filter(ur -> platformCodes.contains(ur.getRole()))
                .map(ur -> new UserBusinessRoleVO(ur.getRole(), ur.getStatus()))
                .toList();
    }

    /**
     * 全量替换用户平台角色：新增的直接生效，多余的移除。
     * <p>仅操作平台角色，不影响用户的业务角色。</p>
     */
    @Transactional
    public List<UserBusinessRoleVO> assignRoles(Integer userId, AssignBusinessRolesRequest request) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");
        }

        Set<String> platformCodes = getPlatformRoleCodes();

        List<String> targetCodes = request.getRoleCodes().stream()
                .distinct()
                .toList();

        for (String code : targetCodes) {
            if (!platformCodes.contains(code)) {
                throw new BusinessException(ErrorCode.PARAM_INVALID,
                        "仅允许分配平台管理角色，无效编码：" + code);
            }
        }

        List<UserRole> existingPlatformRoles = userRoleRepository.findByUserId(userId).stream()
                .filter(ur -> platformCodes.contains(ur.getRole()))
                .toList();

        Set<String> existingCodes = existingPlatformRoles.stream()
                .map(UserRole::getRole)
                .collect(Collectors.toSet());
        Set<String> targetSet = new HashSet<>(targetCodes);

        List<UserRole> toRemove = existingPlatformRoles.stream()
                .filter(ur -> !targetSet.contains(ur.getRole()))
                .toList();
        if (!toRemove.isEmpty()) {
            userRoleRepository.deleteAll(toRemove);
        }

        List<UserRole> toAdd = targetCodes.stream()
                .filter(code -> !existingCodes.contains(code))
                .map(code -> {
                    UserRole ur = new UserRole();
                    ur.setUserId(userId);
                    ur.setRole(code);
                    ur.setStatus(1);
                    return ur;
                })
                .toList();
        if (!toAdd.isEmpty()) {
            userRoleRepository.saveAll(toAdd);
        }

        return userRoleRepository.findByUserId(userId).stream()
                .filter(ur -> platformCodes.contains(ur.getRole()))
                .map(ur -> new UserBusinessRoleVO(ur.getRole(), ur.getStatus()))
                .toList();
    }

    private Specification<User> buildSpec(AdminUserQuery query) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), query.getStatus()));
            }

            if (query.getSearch() != null && !query.getSearch().isBlank()) {
                String like = "%" + query.getSearch().trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("phone"), like),
                        cb.like(root.get("nickname"), like),
                        cb.like(root.get("realName"), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
