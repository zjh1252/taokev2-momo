package com.taoke.user.service.binding;

import com.taoke.common.enums.BindingStatus;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.entity.*;
import com.taoke.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 角色绑定鉴权服务。
 * <p>统一汇总「当前操作者能代管的专家 user_id 集合」，并提供 require 校验。
 * <ul>
 *   <li>本人是 TRAINER → 自己</li>
 *   <li>AgentTrainerBinding（直接）：当前用户作为经纪人绑定的专家</li>
 *   <li>EnterpriseAgentMember + EnterpriseAgentTrainerBinding（间接）：经纪人通过隶属经纪公司</li>
 *   <li>TrainerAssistantBinding（直接）：当前用户作为助理绑定的专家</li>
 *   <li>EnterpriseAgentTrainerBinding（直接）：当前用户作为经纪公司负责人绑定的专家</li>
 *   <li>InstitutionTrainerBinding（直接）：当前用户作为机构主体绑定的专家</li>
 *   <li>InstitutionEmployeeBinding + InstitutionTrainerBinding（间接）：机构员工通过隶属机构</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 14:30
 */
@Service
@RequiredArgsConstructor
public class BindingAuthorizationService implements BindingAuthority {

    private final TrainerRepository trainerRepository;
    private final InstitutionRepository institutionRepository;
    private final EnterpriseAgentRepository enterpriseAgentRepository;
    private final AgentTrainerBindingRepository agentTrainerBindingRepository;
    private final TrainerAssistantBindingRepository trainerAssistantBindingRepository;
    private final InstitutionTrainerBindingRepository institutionTrainerBindingRepository;
    private final InstitutionEmployeeBindingRepository institutionEmployeeBindingRepository;
    private final EnterpriseAgentMemberRepository enterpriseAgentMemberRepository;
    private final EnterpriseAgentTrainerBindingRepository enterpriseAgentTrainerBindingRepository;

    private static final int ACTIVE = BindingStatus.ACTIVE.getCode();

    /**
     * 列出当前用户能代管的所有专家 user_id（含本人是 TRAINER 的情况）。
     */
    @Override
    @Transactional(readOnly = true)
    public Set<Integer> listManagedTrainerUserIds(Integer operatorUserId) {
        if (operatorUserId == null) {
            return Collections.emptySet();
        }
        Set<Integer> result = new LinkedHashSet<>();

        // 1) 本人是 TRAINER
        trainerRepository.findByUserId(operatorUserId).ifPresent(t -> result.add(t.getUserId()));

        // 2) 经纪人直接绑定
        for (AgentTrainerBinding b : agentTrainerBindingRepository.findByAgentUserIdAndStatus(operatorUserId, ACTIVE)) {
            result.add(b.getTrainerUserId());
        }

        // 3) 经纪人通过隶属经纪公司间接绑定（me ∈ enterprise_agent_members.agent_user_id）
        Optional<EnterpriseAgentMember> memberOpt = enterpriseAgentMemberRepository.findByAgentUserId(operatorUserId);
        memberOpt.ifPresent(m -> {
            for (EnterpriseAgentTrainerBinding b :
                    enterpriseAgentTrainerBindingRepository.findByEnterpriseAgentIdAndStatus(m.getEnterpriseAgentId(), ACTIVE)) {
                result.add(b.getTrainerUserId());
            }
        });

        // 4) 助理直接绑定
        for (TrainerAssistantBinding b : trainerAssistantBindingRepository.findByAssistantUserIdAndStatus(operatorUserId, ACTIVE)) {
            result.add(b.getTrainerUserId());
        }

        // 5) 经纪公司负责人 → 经纪公司绑定专家
        enterpriseAgentRepository.findByUserId(operatorUserId).ifPresent(ea -> {
            for (EnterpriseAgentTrainerBinding b :
                    enterpriseAgentTrainerBindingRepository.findByEnterpriseAgentIdAndStatus(ea.getId(), ACTIVE)) {
                result.add(b.getTrainerUserId());
            }
        });

        // 6) 机构主体 → 机构绑定专家
        institutionRepository.findByUserId(operatorUserId).ifPresent(inst -> {
            for (InstitutionTrainerBinding b :
                    institutionTrainerBindingRepository.findByOrgIdAndStatus(inst.getId(), ACTIVE)) {
                result.add(b.getTrainerUserId());
            }
        });

        // 7) 机构员工 → 隶属机构 → 机构绑定专家
        institutionEmployeeBindingRepository.findByEmployeeUserIdAndStatus(operatorUserId, ACTIVE).forEach(ee -> {
            for (InstitutionTrainerBinding b :
                    institutionTrainerBindingRepository.findByOrgIdAndStatus(ee.getOrgId(), ACTIVE)) {
                result.add(b.getTrainerUserId());
            }
        });

        return result;
    }

    /**
     * 当前用户能代管的专家 ID 集合（user_trainers.id），便于资源表按 trainer_id 过滤。
     */
    @Override
    @Transactional(readOnly = true)
    public Set<Integer> listManagedTrainerIds(Integer operatorUserId) {
        Set<Integer> userIds = listManagedTrainerUserIds(operatorUserId);
        if (userIds.isEmpty()) {
            return Collections.emptySet();
        }
        return trainerRepository.findAll().stream()
                .filter(t -> userIds.contains(t.getUserId()))
                .map(Trainer::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    /**
     * 校验当前用户是否有权代管指定专家（按 user_id），无权则抛 FORBIDDEN。
     */
    @Override
    @Transactional(readOnly = true)
    public void requireCanManageTrainer(Integer operatorUserId, Integer targetTrainerUserId) {
        if (operatorUserId == null || targetTrainerUserId == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        if (!listManagedTrainerUserIds(operatorUserId).contains(targetTrainerUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权代管该专家的资源");
        }
    }

    /**
     * 解析请求中的 trainerUserId：缺省返回 operatorUserId 本身（兼容 TRAINER 自管），并校验权限。
     */
    @Override
    @Transactional(readOnly = true)
    public Integer resolveTargetTrainerUserId(Integer operatorUserId, Integer requestedTrainerUserId) {
        Integer target = requestedTrainerUserId != null ? requestedTrainerUserId : operatorUserId;
        requireCanManageTrainer(operatorUserId, target);
        return target;
    }
}
