package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.UserService;
import com.taoke.user.api.VerificationCodeService;
import com.taoke.user.dto.user.ChangePasswordRequest;
import com.taoke.user.dto.user.ChangePhoneRequest;
import com.taoke.user.dto.user.UpdateProfileRequest;
import com.taoke.user.dto.user.UserProfileResponse;
import com.taoke.common.enums.BusinessRole;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.mapper.UserMapper;
import com.taoke.user.repository.AgentRepository;
import com.taoke.user.repository.AgentTrainerBindingRepository;
import com.taoke.user.repository.AssistantRepository;
import com.taoke.user.repository.BuyerRepository;
import com.taoke.user.repository.EnterpriseAgentMemberRepository;
import com.taoke.user.repository.EnterpriseAgentRepository;
import com.taoke.user.repository.EnterpriseAgentTrainerBindingRepository;
import com.taoke.user.repository.EnterpriseBuyerRepository;
import com.taoke.user.repository.InstitutionEmployeeBindingRepository;
import com.taoke.user.repository.InstitutionEmployeeRepository;
import com.taoke.user.repository.InstitutionRepository;
import com.taoke.user.repository.InstitutionTrainerBindingRepository;
import com.taoke.user.repository.TrainerAssistantBindingRepository;
import com.taoke.user.repository.TrainerRepository;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 用户自服务：个人信息查询/修改、密码管理、手机号变更。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationCodeService verificationCodeService;
    private final UserMapper userMapper;
    // 注销账号 / 注销身份所需的全部角色子表 + 绑定表
    private final TrainerRepository trainerRepository;
    private final AgentRepository agentRepository;
    private final AssistantRepository assistantRepository;
    private final EnterpriseAgentRepository enterpriseAgentRepository;
    private final InstitutionRepository institutionRepository;
    private final InstitutionEmployeeRepository institutionEmployeeRepository;
    private final BuyerRepository buyerRepository;
    private final EnterpriseBuyerRepository enterpriseBuyerRepository;
    private final AgentTrainerBindingRepository agentTrainerBindingRepository;
    private final TrainerAssistantBindingRepository trainerAssistantBindingRepository;
    private final InstitutionTrainerBindingRepository institutionTrainerBindingRepository;
    private final InstitutionEmployeeBindingRepository institutionEmployeeBindingRepository;
    private final EnterpriseAgentTrainerBindingRepository enterpriseAgentTrainerBindingRepository;
    private final EnterpriseAgentMemberRepository enterpriseAgentMemberRepository;

    @Override
    public UserProfileResponse getProfile(Integer userId) {
        User user = findUser(userId);

        UserProfileResponse resp = userMapper.toProfileResponse(user);
        resp.setHasPassword(user.getPasswordHash() != null && !user.getPasswordHash().isEmpty());

        List<UserRole> userRoles = userRoleRepository.findByUserId(userId);
        resp.setRoles(userRoles.stream().map(userMapper::toRoleInfo).toList());

        return resp;
    }

    @Transactional
    @Override
    public void updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = findUser(userId);

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getRealName() != null) {
            user.setRealName(request.getRealName());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getStudyTags() != null) {
            user.setStudyTags(request.getStudyTags());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getPostCode() != null) {
            user.setPostCode(request.getPostCode());
        }
        if (request.getProvinceId() != null) {
            user.setProvinceId(request.getProvinceId());
        }
        if (request.getCityId() != null) {
            user.setCityId(request.getCityId());
        }
        if (request.getDistrictId() != null) {
            user.setDistrictId(request.getDistrictId());
        }
        if (request.getTownId() != null) {
            user.setTownId(request.getTownId());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        userRepository.save(user);
    }

    /**
     * 修改密码（已登录状态）
     * <p>
     * 若用户尚未设置过密码（如手机验证码登录注册的用户），则直接设置新密码；
     * 否则必须提供正确的旧密码。
     */
    @Transactional
    @Override
    public void changePassword(Integer userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        boolean hasPassword = user.getPasswordHash() != null && !user.getPasswordHash().isEmpty();

        if (hasPassword) {
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                throw new BusinessException(ErrorCode.OLD_PASSWORD_INCORRECT, "请输入旧密码");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new BusinessException(ErrorCode.OLD_PASSWORD_INCORRECT);
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * 变更手机号（双验证码校验）
     * <p>
     * 先校验旧手机验证码，再校验新手机验证码，最后更新手机号。
     */
    @Transactional
    @Override
    public void changePhone(Integer userId, ChangePhoneRequest request) {
        User user = findUser(userId);

        // 校验旧手机验证码
        verificationCodeService.verifyCode(user.getPhone(), request.getOldPhoneCode(), "CHANGE_PHONE");

        // 校验新手机号是否已被绑定
        if (userRepository.existsByPhone(request.getNewPhone())) {
            throw new BusinessException(ErrorCode.PHONE_ALREADY_BOUND);
        }

        // 校验新手机验证码
        verificationCodeService.verifyCode(request.getNewPhone(), request.getNewPhoneCode(), "CHANGE_PHONE");

        user.setPhone(request.getNewPhone());
        userRepository.save(user);
    }

    @Transactional
    @Override
    public void updateStatus(Integer userId, Integer status, String freezeReason) {
        User user = findUser(userId);
        user.setStatus(status);
        user.setFreezeReason(freezeReason);
        userRepository.save(user);
    }

    @Override
    public Page<User> searchUsers(String search, Integer status, Pageable pageable) {
        Specification<User> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("phone"), like),
                        cb.like(root.get("nickname"), like),
                        cb.like(root.get("realName"), like)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return userRepository.findAll(spec, pageable);
    }

    @Override
    public boolean existsById(Integer userId) {
        return userRepository.existsById(userId);
    }

    @Override
    public List<Integer> getActiveUserIds() {
        return userRepository.findByStatus(1).stream()
                .map(User::getId)
                .toList();
    }

    @Override
    public List<User> findAllByIds(List<Integer> ids) {
        return userRepository.findAllById(ids);
    }

    // ==================== 注销账号 / 注销身份 ====================

    @Transactional
    @Override
    public void deleteOwnAccount(Integer userId) {
        // 1. 删除该用户作为「主体」的全部业务子表记录（user_trainers / user_agents / ...）
        deleteAllRoleProfiles(userId);
        // 2. 删除该用户参与的全部绑定关系（无论作为哪一侧）
        deleteAllBindingsRelatedToUser(userId);
        // 3. 删除角色记录（按 user_id 一次性扫出所有状态的角色行）
        userRoleRepository.findByUserId(userId).forEach(userRoleRepository::delete);
        // 4. 删除用户主表
        userRepository.deleteById(userId);
    }

    @Transactional
    @Override
    public void withdrawRole(Integer userId, String roleCode) {
        if (roleCode == null || roleCode.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "未指定要注销的角色");
        }
        // BUYER 是平台默认角色，不允许单独注销；如需注销请走「注销账号」
        if (BusinessRole.Code.BUYER.equals(roleCode)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID,
                    "个人学员为默认角色，无法单独注销，请使用「注销账号」");
        }
        UserRole userRole = userRoleRepository.findByUserIdAndRole(userId, roleCode).orElse(null);
        if (userRole == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "未找到该角色记录");
        }

        // 删对应业务子表 + 该角色相关的绑定
        deleteRoleProfileByCode(userId, roleCode);
        deleteBindingsByRoleAndUser(userId, roleCode);

        // 删 sys_user_roles 行
        userRoleRepository.delete(userRole);
    }

    /**
     * 删除该用户对应的所有业务子表记录（user_trainers / user_agents / ...）。
     */
    private void deleteAllRoleProfiles(Integer userId) {
        trainerRepository.findByUserId(userId).ifPresent(trainerRepository::delete);
        agentRepository.findByUserId(userId).ifPresent(agentRepository::delete);
        assistantRepository.findByUserId(userId).ifPresent(assistantRepository::delete);
        enterpriseAgentRepository.findByUserId(userId).ifPresent(enterpriseAgentRepository::delete);
        institutionRepository.findByUserId(userId).ifPresent(institutionRepository::delete);
        institutionEmployeeRepository.findByUserId(userId).ifPresent(institutionEmployeeRepository::delete);
        buyerRepository.findByUserId(userId).ifPresent(buyerRepository::delete);
        enterpriseBuyerRepository.findByUserId(userId).ifPresent(enterpriseBuyerRepository::delete);
    }

    /**
     * 按角色编码删除对应业务子表（单一角色注销）。
     */
    private void deleteRoleProfileByCode(Integer userId, String roleCode) {
        switch (roleCode) {
            case BusinessRole.Code.TRAINER ->
                    trainerRepository.findByUserId(userId).ifPresent(trainerRepository::delete);
            case BusinessRole.Code.AGENT ->
                    agentRepository.findByUserId(userId).ifPresent(agentRepository::delete);
            case BusinessRole.Code.ASSISTANT ->
                    assistantRepository.findByUserId(userId).ifPresent(assistantRepository::delete);
            case BusinessRole.Code.ENTERPRISE_AGENT ->
                    enterpriseAgentRepository.findByUserId(userId).ifPresent(enterpriseAgentRepository::delete);
            case BusinessRole.Code.INSTITUTION ->
                    institutionRepository.findByUserId(userId).ifPresent(institutionRepository::delete);
            case BusinessRole.Code.INSTITUTION_EMPLOYEE ->
                    institutionEmployeeRepository.findByUserId(userId).ifPresent(institutionEmployeeRepository::delete);
            case BusinessRole.Code.ENTERPRISE_BUYER ->
                    enterpriseBuyerRepository.findByUserId(userId).ifPresent(enterpriseBuyerRepository::delete);
            default -> {
                // 平台运营角色（PLATFORM_AUDITOR/PLATFORM_CS/SUPER_ADMIN）无子表，跳过
            }
        }
    }

    /**
     * 删除该用户参与的所有绑定关系（无论作为发起方还是确认方）。
     */
    private void deleteAllBindingsRelatedToUser(Integer userId) {
        // 经纪人 ↔ 专家（既可能是经纪人也可能是专家）
        agentTrainerBindingRepository.deleteAll(agentTrainerBindingRepository.findByAgentUserId(userId));
        agentTrainerBindingRepository.deleteAll(agentTrainerBindingRepository.findByTrainerUserId(userId));
        // 助理 ↔ 专家
        trainerAssistantBindingRepository.deleteAll(trainerAssistantBindingRepository.findAllByAssistantUserId(userId));
        trainerAssistantBindingRepository.deleteAll(trainerAssistantBindingRepository.findAllByTrainerUserId(userId));
        // 机构 ↔ 专家
        institutionTrainerBindingRepository.deleteAll(institutionTrainerBindingRepository.findByTrainerUserId(userId));
        // 机构 → 员工
        institutionEmployeeBindingRepository.findByEmployeeUserId(userId)
                .ifPresent(institutionEmployeeBindingRepository::delete);
        // 经纪公司 ↔ 专家
        enterpriseAgentTrainerBindingRepository.deleteAll(
                enterpriseAgentTrainerBindingRepository.findByTrainerUserId(userId));
        // 经纪公司 → 经纪人
        enterpriseAgentMemberRepository.findAllByAgentUserId(userId)
                .forEach(enterpriseAgentMemberRepository::delete);
    }

    /**
     * 按角色注销时删除该角色专属的绑定关系（只删跟当前注销角色相关的，其它身份的绑定保留）。
     */
    private void deleteBindingsByRoleAndUser(Integer userId, String roleCode) {
        switch (roleCode) {
            case BusinessRole.Code.TRAINER -> {
                // 注销专家身份 → 该用户作为「专家」的所有绑定全删
                agentTrainerBindingRepository.deleteAll(agentTrainerBindingRepository.findByTrainerUserId(userId));
                trainerAssistantBindingRepository.deleteAll(trainerAssistantBindingRepository.findAllByTrainerUserId(userId));
                institutionTrainerBindingRepository.deleteAll(institutionTrainerBindingRepository.findByTrainerUserId(userId));
                enterpriseAgentTrainerBindingRepository.deleteAll(
                        enterpriseAgentTrainerBindingRepository.findByTrainerUserId(userId));
            }
            case BusinessRole.Code.AGENT -> {
                // 经纪人身份注销：作为经纪人的代管绑定 + 作为经纪公司成员的归属关系
                agentTrainerBindingRepository.deleteAll(agentTrainerBindingRepository.findByAgentUserId(userId));
                enterpriseAgentMemberRepository.findAllByAgentUserId(userId)
                        .forEach(enterpriseAgentMemberRepository::delete);
            }
            case BusinessRole.Code.ASSISTANT -> trainerAssistantBindingRepository.deleteAll(
                    trainerAssistantBindingRepository.findAllByAssistantUserId(userId));
            case BusinessRole.Code.INSTITUTION_EMPLOYEE -> institutionEmployeeBindingRepository
                    .findByEmployeeUserId(userId).ifPresent(institutionEmployeeBindingRepository::delete);
            case BusinessRole.Code.INSTITUTION, BusinessRole.Code.ENTERPRISE_AGENT,
                 BusinessRole.Code.ENTERPRISE_BUYER -> {
                // 机构 / 经纪公司 / 企业采购作为本身主体的绑定，由 deleteRoleProfileByCode
                // 通过删除主体（user_institutions / user_enterprise_agents）让对应绑定指向孤儿；
                // 这里不再主动清理对方记录，避免误伤其它实体身份（例如机构员工同时还是专家）。
            }
            default -> {
                // PLATFORM_* / SUPER_ADMIN 无绑定关系
            }
        }
    }

    private User findUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
    }
}
