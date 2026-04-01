package com.taoke.admin.service;

import com.taoke.admin.dto.AdminUserQuery;
import com.taoke.admin.dto.AdminUserVO;
import com.taoke.admin.dto.UpdateUserStatusRequest;
import com.taoke.admin.mapper.AdminUserMapper;
import com.taoke.common.dto.PageResult;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 后台用户管理服务。
 *
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final AdminUserMapper adminUserMapper;

    /**
     * 分页查询用户列表（三段式：条件分页 -> 回表 -> 批量查角色组装）。
     */
    public PageResult<AdminUserVO> listUsers(AdminUserQuery query) {
        Specification<User> spec = buildSpec(query);
        PageRequest pageable = PageRequest.of(
                query.getPage() - 1, query.getSize(),
                Sort.by(Sort.Direction.DESC, "id")
        );

        // 第一段：分页查询
        Page<User> userPage = userRepository.findAll(spec, pageable);
        List<User> users = userPage.getContent();

        if (users.isEmpty()) {
            return PageResult.of(userPage.getTotalElements(), query.getPage(), query.getSize(), List.of());
        }

        // 第二段：批量查角色
        List<Integer> userIds = users.stream().map(User::getId).toList();
        Map<Integer, List<UserRole>> roleMap = userRoleRepository.findByUserIdIn(userIds)
                .stream()
                .collect(Collectors.groupingBy(UserRole::getUserId));

        // 第三段：组装 VO
        List<AdminUserVO> voList = users.stream().map(user -> {
            AdminUserVO vo = adminUserMapper.toVO(user);
            List<UserRole> roles = roleMap.getOrDefault(user.getId(), List.of());
            vo.setRoles(roles.stream().map(adminUserMapper::toRoleItem).toList());
            return vo;
        }).toList();

        return PageResult.of(userPage.getTotalElements(), query.getPage(), query.getSize(), voList);
    }

    /**
     * 变更用户状态（冻结/解冻）。
     */
    @Transactional
    public void updateStatus(Integer userId, UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        user.setStatus(request.getStatus());
        user.setFreezeReason(request.getStatus() == 0 ? request.getFreezeReason() : null);
        userRepository.save(user);
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
