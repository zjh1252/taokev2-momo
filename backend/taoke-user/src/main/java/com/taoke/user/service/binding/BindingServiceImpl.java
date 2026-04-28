package com.taoke.user.service.binding;

import com.taoke.common.enums.BindingStatus;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.enums.NotificationType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.BindingService;
import com.taoke.user.api.NotificationService;
import com.taoke.user.dto.binding.BindingItemResponse;
import com.taoke.user.dto.binding.BindingType;
import com.taoke.user.dto.binding.InitiateBindingRequest;
import com.taoke.user.entity.*;
import com.taoke.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 角色绑定关系业务实现。
 *
 * @author Fangxinxin
 * @date 2026-04-21 15:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BindingServiceImpl implements BindingService {

    private final UserRepository userRepository;
    private final TrainerRepository trainerRepository;
    private final InstitutionRepository institutionRepository;
    private final EnterpriseAgentRepository enterpriseAgentRepository;
    private final AgentTrainerBindingRepository agentTrainerBindingRepository;
    private final TrainerAssistantBindingRepository trainerAssistantBindingRepository;
    private final InstitutionTrainerBindingRepository institutionTrainerBindingRepository;
    private final InstitutionEmployeeBindingRepository institutionEmployeeBindingRepository;
    private final EnterpriseAgentTrainerBindingRepository enterpriseAgentTrainerBindingRepository;
    private final EnterpriseAgentMemberRepository enterpriseAgentMemberRepository;
    private final BindingAuthorizationService bindingAuthorizationService;
    private final NotificationService notificationService;
    private final UserRoleRepository userRoleRepository;

    private static final int ACTIVE = BindingStatus.ACTIVE.getCode();
    private static final int PENDING = BindingStatus.PENDING.getCode();
    private static final int UNBOUND = BindingStatus.UNBOUND.getCode();
    private static final int REJECTED = BindingStatus.REJECTED.getCode();

    // ============================================================
    // 发起绑定
    // ============================================================

    @Override
    @Transactional
    public BindingItemResponse initiate(Integer operatorUserId, InitiateBindingRequest req) {
        if (req.getBindingType() == null || req.getTargetUserId() == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "绑定类型与目标用户 ID 必填");
        }
        if (Objects.equals(operatorUserId, req.getTargetUserId())) {
            // 按绑定类型给更具体的提示文案，便于前端 toast 直接展示
            String msg = switch (req.getBindingType()) {
                case ENTERPRISE_AGENT_MEMBER -> "不能邀请自己作为经纪人";
                case INSTITUTION_EMPLOYEE -> "不能邀请自己作为员工";
                case AGENT_TRAINER, ASSISTANT_TRAINER, INSTITUTION_TRAINER, ENTERPRISE_AGENT_TRAINER ->
                        "不能邀请自己作为专家";
                default -> "不能向自己发起绑定";
            };
            throw new BusinessException(ErrorCode.PARAM_INVALID, msg);
        }
        // 校验目标用户存在
        userRepository.findById(req.getTargetUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "目标用户不存在"));

        switch (req.getBindingType()) {
            case AGENT_TRAINER:
                return initiateAgentTrainer(operatorUserId, req.getTargetUserId(), req.getNote());
            case ASSISTANT_TRAINER:
                return initiateAssistantTrainer(operatorUserId, req.getTargetUserId(), req.getNote());
            case INSTITUTION_TRAINER:
                return initiateInstitutionTrainer(operatorUserId, req.getTargetUserId(), req.getNote());
            case ENTERPRISE_AGENT_TRAINER:
                return initiateEnterpriseAgentTrainer(operatorUserId, req.getTargetUserId(), req.getNote());
            case INSTITUTION_EMPLOYEE:
                return initiateInstitutionEmployee(operatorUserId, req.getTargetUserId(), req.getNote());
            case ENTERPRISE_AGENT_MEMBER:
                return initiateEnterpriseAgentMember(operatorUserId, req.getTargetUserId(), req.getNote());
            default:
                throw new BusinessException(ErrorCode.PARAM_INVALID, "未知的绑定类型");
        }
    }

    private BindingItemResponse initiateAgentTrainer(Integer agentUserId, Integer trainerUserId, String note) {
        requireTargetIsTrainer(trainerUserId);
        AgentTrainerBinding b = agentTrainerBindingRepository
                .findByAgentUserIdAndTrainerUserId(agentUserId, trainerUserId)
                .orElseGet(AgentTrainerBinding::new);
        // 仅对已持久化记录做"已存在/重复"判断，避免 transient 实例默认 status=1 触发误报
        if (b.getId() != null && Objects.equals(b.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的绑定");
        }
        // 幂等：同一发起方对同一目标已存在 PENDING 时直接返回
        if (b.getId() != null && Objects.equals(b.getStatus(), PENDING)
                && Objects.equals(b.getInitiatorUserId(), agentUserId)) {
            return toResponse(b, BindingType.AGENT_TRAINER, agentUserId, trainerUserId);
        }
        b.setAgentUserId(agentUserId);
        b.setTrainerUserId(trainerUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(agentUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        agentTrainerBindingRepository.save(b);
        notifyBindingRequest(trainerUserId, agentUserId, BindingType.AGENT_TRAINER, null);
        return toResponse(b, BindingType.AGENT_TRAINER, agentUserId, trainerUserId);
    }

    private BindingItemResponse initiateAssistantTrainer(Integer assistantUserId, Integer trainerUserId, String note) {
        requireTargetIsTrainer(trainerUserId);
        // 一对一：助理已绑定其他专家时不允许
        trainerAssistantBindingRepository.findByAssistantUserId(assistantUserId).ifPresent(exist -> {
            if (Objects.equals(exist.getStatus(), ACTIVE) || Objects.equals(exist.getStatus(), PENDING)) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "您已存在助理绑定关系");
            }
        });
        TrainerAssistantBinding b = trainerAssistantBindingRepository
                .findByTrainerUserId(trainerUserId)
                .orElseGet(TrainerAssistantBinding::new);
        // 仅对已持久化记录做冲突判断，避免 transient 实例默认值触发误报
        if (b.getId() != null && Objects.equals(b.getStatus(), ACTIVE)
                && !Objects.equals(b.getAssistantUserId(), assistantUserId)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "目标专家已绑定其他助理");
        }
        // 幂等：同一助理对同一专家已存在 PENDING 时直接返回
        if (b.getId() != null && Objects.equals(b.getStatus(), PENDING)
                && Objects.equals(b.getAssistantUserId(), assistantUserId)
                && Objects.equals(b.getInitiatorUserId(), assistantUserId)) {
            return toResponse(b, BindingType.ASSISTANT_TRAINER, assistantUserId, trainerUserId);
        }
        b.setTrainerUserId(trainerUserId);
        b.setAssistantUserId(assistantUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(assistantUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        trainerAssistantBindingRepository.save(b);
        notifyBindingRequest(trainerUserId, assistantUserId, BindingType.ASSISTANT_TRAINER, null);
        return toResponse(b, BindingType.ASSISTANT_TRAINER, assistantUserId, trainerUserId);
    }

    private BindingItemResponse initiateInstitutionTrainer(Integer operatorUserId, Integer trainerUserId, String note) {
        Institution inst = institutionRepository.findByUserId(operatorUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是机构主体"));
        requireTargetIsTrainer(trainerUserId);
        InstitutionTrainerBinding b = institutionTrainerBindingRepository
                .findByOrgIdAndTrainerUserId(inst.getId(), trainerUserId)
                .orElseGet(InstitutionTrainerBinding::new);
        if (b.getId() != null && Objects.equals(b.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的绑定");
        }
        if (b.getId() != null && Objects.equals(b.getStatus(), PENDING)
                && Objects.equals(b.getInitiatorUserId(), operatorUserId)) {
            return toResponse(b, BindingType.INSTITUTION_TRAINER, operatorUserId, trainerUserId);
        }
        b.setOrgId(inst.getId());
        b.setTrainerUserId(trainerUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(operatorUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        institutionTrainerBindingRepository.save(b);
        notifyBindingRequest(trainerUserId, operatorUserId, BindingType.INSTITUTION_TRAINER, inst.getOrgName());
        return toResponse(b, BindingType.INSTITUTION_TRAINER, operatorUserId, trainerUserId);
    }

    private BindingItemResponse initiateEnterpriseAgentTrainer(Integer operatorUserId, Integer trainerUserId, String note) {
        EnterpriseAgent ea = enterpriseAgentRepository.findByUserId(operatorUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是经纪公司负责人"));
        requireTargetIsTrainer(trainerUserId);
        EnterpriseAgentTrainerBinding b = enterpriseAgentTrainerBindingRepository
                .findByEnterpriseAgentIdAndTrainerUserId(ea.getId(), trainerUserId)
                .orElseGet(EnterpriseAgentTrainerBinding::new);
        if (b.getId() != null && Objects.equals(b.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的绑定");
        }
        if (b.getId() != null && Objects.equals(b.getStatus(), PENDING)
                && Objects.equals(b.getInitiatorUserId(), operatorUserId)) {
            return toResponse(b, BindingType.ENTERPRISE_AGENT_TRAINER, operatorUserId, trainerUserId);
        }
        b.setEnterpriseAgentId(ea.getId());
        b.setTrainerUserId(trainerUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(operatorUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        enterpriseAgentTrainerBindingRepository.save(b);
        notifyBindingRequest(trainerUserId, operatorUserId, BindingType.ENTERPRISE_AGENT_TRAINER, ea.getCompanyName());
        return toResponse(b, BindingType.ENTERPRISE_AGENT_TRAINER, operatorUserId, trainerUserId);
    }

    private BindingItemResponse initiateInstitutionEmployee(Integer operatorUserId, Integer employeeUserId, String note) {
        Institution inst = institutionRepository.findByUserId(operatorUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是机构主体"));
        InstitutionEmployeeBinding b = institutionEmployeeBindingRepository
                .findByOrgIdAndEmployeeUserId(inst.getId(), employeeUserId)
                .orElseGet(InstitutionEmployeeBinding::new);
        if (b.getId() != null && Objects.equals(b.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的绑定");
        }
        // 重复邀请拦截：双方之间已存在进行中的邀请记录（无论谁发起）
        if (b.getId() != null && Objects.equals(b.getStatus(), PENDING)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID,
                    "对方与你已存在进行中的邀请记录，请到「我的员工」查看");
        }
        // 限制：员工已 ACTIVE 绑定到其他机构 → 阻止本次邀请，与员工反向申请流程对齐
        institutionEmployeeBindingRepository.findByEmployeeUserIdAndStatus(employeeUserId, ACTIVE)
                .stream().findFirst().ifPresent(active -> {
                    if (!Objects.equals(active.getOrgId(), inst.getId())) {
                        throw new BusinessException(ErrorCode.PARAM_INVALID,
                                "该员工已隶属其他机构，请其先解绑");
                    }
                });
        b.setOrgId(inst.getId());
        b.setEmployeeUserId(employeeUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(operatorUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        institutionEmployeeBindingRepository.save(b);
        notifyBindingRequest(employeeUserId, operatorUserId, BindingType.INSTITUTION_EMPLOYEE, inst.getOrgName());
        return toResponse(b, BindingType.INSTITUTION_EMPLOYEE, operatorUserId, employeeUserId);
    }

    private BindingItemResponse initiateEnterpriseAgentMember(Integer operatorUserId, Integer agentUserId, String note) {
        EnterpriseAgent ea = enterpriseAgentRepository.findByUserId(operatorUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是经纪公司负责人"));
        EnterpriseAgentMember m = enterpriseAgentMemberRepository
                .findByEnterpriseAgentIdAndAgentUserId(ea.getId(), agentUserId)
                .orElseGet(EnterpriseAgentMember::new);
        // 仅对已持久化记录做"已存在"判断，避免 transient 实例默认 status=1 触发误报
        if (m.getId() != null && Objects.equals(m.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的成员关系");
        }
        // 重复邀请拦截：双方之间已存在进行中的邀请记录（无论谁发起），不再覆盖也不幂等返回
        if (m.getId() != null && Objects.equals(m.getStatus(), PENDING)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID,
                    "对方与你已存在进行中的邀请记录，请到「我的经纪人」查看");
        }
        // 限制：经纪人最多 ACTIVE 绑定到一个经纪公司
        for (EnterpriseAgentMember other : enterpriseAgentMemberRepository.findByAgentUserIdAndStatus(agentUserId, ACTIVE)) {
            if (!Objects.equals(other.getEnterpriseAgentId(), ea.getId())) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "该经纪人已隶属其他经纪公司");
            }
        }
        m.setEnterpriseAgentId(ea.getId());
        m.setAgentUserId(agentUserId);
        m.setStatus(PENDING);
        m.setNote(note);
        m.setInitiatorUserId(operatorUserId);
        m.setRejectReason(null);
        m.setConfirmedAt(null);
        if (m.getJoinedAt() == null) {
            m.setJoinedAt(LocalDateTime.now());
        }
        enterpriseAgentMemberRepository.save(m);
        notifyBindingRequest(agentUserId, operatorUserId, BindingType.ENTERPRISE_AGENT_MEMBER, ea.getCompanyName());
        return toResponse(m, BindingType.ENTERPRISE_AGENT_MEMBER, operatorUserId, agentUserId);
    }

    @Override
    @Transactional
    public BindingItemResponse initiateInstitutionEmployeeFromEmployee(Integer employeeUserId, Integer orgId, String note) {
        if (employeeUserId == null || orgId == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "员工用户 ID 与目标机构 ID 必填");
        }
        Institution inst = institutionRepository.findById(orgId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "目标机构不存在"));
        // 机构负责人不能作为自己机构的员工
        if (Objects.equals(inst.getUserId(), employeeUserId)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "不能申请加入自己负责的机构");
        }
        // 不允许员工已存在 ACTIVE 绑定到其他机构
        institutionEmployeeBindingRepository.findByEmployeeUserIdAndStatus(employeeUserId, ACTIVE)
                .stream().findFirst().ifPresent(active -> {
                    if (!Objects.equals(active.getOrgId(), orgId)) {
                        throw new BusinessException(ErrorCode.PARAM_INVALID, "您已绑定其他机构，请先解绑");
                    }
                });
        InstitutionEmployeeBinding b = institutionEmployeeBindingRepository
                .findByOrgIdAndEmployeeUserId(orgId, employeeUserId)
                .orElseGet(InstitutionEmployeeBinding::new);
        // 仅对已持久化记录做判断，避免 transient 实例默认 status=1 触发误报
        if (b.getId() != null && Objects.equals(b.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的绑定");
        }
        Integer instUser = inst.getUserId();
        // 幂等：相同员工对相同机构已经处于 PENDING（且发起方就是员工本人），直接复用，不再抛错
        if (b.getId() != null && Objects.equals(b.getStatus(), PENDING)
                && Objects.equals(b.getInitiatorUserId(), employeeUserId)) {
            return toResponse(b, BindingType.INSTITUTION_EMPLOYEE, instUser, employeeUserId);
        }
        b.setOrgId(orgId);
        b.setEmployeeUserId(employeeUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(employeeUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        institutionEmployeeBindingRepository.save(b);
        // 通知机构主体
        notifyEmployeeApplication(instUser, employeeUserId, inst.getOrgName());
        return toResponse(b, BindingType.INSTITUTION_EMPLOYEE, instUser, employeeUserId);
    }

    @Override
    @Transactional
    public BindingItemResponse initiateEnterpriseAgentMemberFromAgent(Integer agentUserId, Integer enterpriseAgentId, String note) {
        if (agentUserId == null || enterpriseAgentId == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "经纪人用户 ID 与目标经纪公司 ID 必填");
        }
        EnterpriseAgent ea = enterpriseAgentRepository.findById(enterpriseAgentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "目标经纪公司不存在"));
        // 经纪公司负责人不能作为自己公司的经纪人
        if (Objects.equals(ea.getUserId(), agentUserId)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "不能申请加入自己负责的经纪公司");
        }
        for (EnterpriseAgentMember other : enterpriseAgentMemberRepository.findByAgentUserIdAndStatus(agentUserId, ACTIVE)) {
            if (!Objects.equals(other.getEnterpriseAgentId(), enterpriseAgentId)) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "您已隶属其他经纪公司，请先解绑");
            }
        }
        EnterpriseAgentMember m = enterpriseAgentMemberRepository
                .findByEnterpriseAgentIdAndAgentUserId(enterpriseAgentId, agentUserId)
                .orElseGet(EnterpriseAgentMember::new);
        // 仅对已持久化记录做判断，避免 transient 实例默认 status=1 触发误报
        if (m.getId() != null && Objects.equals(m.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的成员关系");
        }
        // 幂等：同一经纪人对同一公司已发起 PENDING 时直接返回，不再误报「重复提交」
        if (m.getId() != null && Objects.equals(m.getStatus(), PENDING)
                && Objects.equals(m.getInitiatorUserId(), agentUserId)) {
            return toResponse(m, BindingType.ENTERPRISE_AGENT_MEMBER, ea.getUserId(), agentUserId);
        }
        m.setEnterpriseAgentId(enterpriseAgentId);
        m.setAgentUserId(agentUserId);
        m.setStatus(PENDING);
        m.setNote(note);
        m.setInitiatorUserId(agentUserId);
        m.setRejectReason(null);
        m.setConfirmedAt(null);
        if (m.getJoinedAt() == null) {
            m.setJoinedAt(LocalDateTime.now());
        }
        enterpriseAgentMemberRepository.save(m);
        notifyAgentApplication(ea.getUserId(), agentUserId, ea.getCompanyName());
        return toResponse(m, BindingType.ENTERPRISE_AGENT_MEMBER, ea.getUserId(), agentUserId);
    }

    private void requireTargetIsTrainer(Integer userId) {
        trainerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARAM_INVALID, "目标用户不是专家"));
    }

    // ============================================================
    // 列表：待我确认 / 我的代理 / 我代管的专家
    // ============================================================

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listMyBindingRequests(Integer trainerUserId) {
        if (trainerUserId == null) return List.of();
        List<BindingItemResponse> all = new ArrayList<>();

        for (AgentTrainerBinding b : agentTrainerBindingRepository.findByTrainerUserIdAndStatus(trainerUserId, PENDING)) {
            all.add(toResponse(b, BindingType.AGENT_TRAINER, b.getAgentUserId(), b.getTrainerUserId()));
        }
        for (TrainerAssistantBinding b : trainerAssistantBindingRepository.findByTrainerUserIdAndStatus(trainerUserId, PENDING)) {
            all.add(toResponse(b, BindingType.ASSISTANT_TRAINER, b.getAssistantUserId(), b.getTrainerUserId()));
        }
        for (InstitutionTrainerBinding b : institutionTrainerBindingRepository.findByTrainerUserIdAndStatus(trainerUserId, PENDING)) {
            Integer initUser = resolveInstitutionUserId(b.getOrgId());
            all.add(toResponse(b, BindingType.INSTITUTION_TRAINER, initUser, b.getTrainerUserId()));
        }
        for (EnterpriseAgentTrainerBinding b : enterpriseAgentTrainerBindingRepository.findByTrainerUserId(trainerUserId)) {
            if (Objects.equals(b.getStatus(), PENDING)) {
                Integer initUser = resolveEnterpriseAgentUserId(b.getEnterpriseAgentId());
                all.add(toResponse(b, BindingType.ENTERPRISE_AGENT_TRAINER, initUser, b.getTrainerUserId()));
            }
        }
        all.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return all;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listMyEmployeeRequests(Integer employeeUserId) {
        if (employeeUserId == null) return List.of();
        return institutionEmployeeBindingRepository.findByEmployeeUserIdAndStatus(employeeUserId, PENDING)
                .stream()
                .map(b -> {
                    Integer initUser = resolveInstitutionUserId(b.getOrgId());
                    return toResponse(b, BindingType.INSTITUTION_EMPLOYEE, initUser, b.getEmployeeUserId());
                })
                .sorted(Comparator.comparing(BindingItemResponse::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listMyAgents(Integer trainerUserId) {
        if (trainerUserId == null) return List.of();
        List<BindingItemResponse> all = new ArrayList<>();

        for (AgentTrainerBinding b : agentTrainerBindingRepository.findByTrainerUserIdAndStatus(trainerUserId, ACTIVE)) {
            all.add(toResponse(b, BindingType.AGENT_TRAINER, b.getAgentUserId(), b.getTrainerUserId()));
        }
        for (TrainerAssistantBinding b : trainerAssistantBindingRepository.findByTrainerUserIdAndStatus(trainerUserId, ACTIVE)) {
            all.add(toResponse(b, BindingType.ASSISTANT_TRAINER, b.getAssistantUserId(), b.getTrainerUserId()));
        }
        for (InstitutionTrainerBinding b : institutionTrainerBindingRepository.findByTrainerUserIdAndStatus(trainerUserId, ACTIVE)) {
            Integer instUser = resolveInstitutionUserId(b.getOrgId());
            all.add(toResponse(b, BindingType.INSTITUTION_TRAINER, instUser, b.getTrainerUserId()));
        }
        for (EnterpriseAgentTrainerBinding b : enterpriseAgentTrainerBindingRepository.findByTrainerUserId(trainerUserId)) {
            if (Objects.equals(b.getStatus(), ACTIVE)) {
                Integer eaUser = resolveEnterpriseAgentUserId(b.getEnterpriseAgentId());
                all.add(toResponse(b, BindingType.ENTERPRISE_AGENT_TRAINER, eaUser, b.getTrainerUserId()));
            }
        }
        all.sort((a, c) -> c.getConfirmedAt() == null ? -1 : a.getConfirmedAt() == null ? 1
                : c.getConfirmedAt().compareTo(a.getConfirmedAt()));
        return all;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listInstitutionTrainers(Integer institutionUserId) {
        if (institutionUserId == null) return List.of();
        Institution inst = institutionRepository.findByUserId(institutionUserId).orElse(null);
        if (inst == null) return List.of();
        List<BindingItemResponse> result = new ArrayList<>();
        // 含 ACTIVE / PENDING / REJECTED / UNBOUND 全部，前端按 status 自行分组
        for (InstitutionTrainerBinding b : institutionTrainerBindingRepository.findByOrgId(inst.getId())) {
            BindingItemResponse r = baseResponse(b.getId(), BindingType.INSTITUTION_TRAINER, b.getStatus(),
                    b.getNote(), b.getRejectReason(), b.getInitiatorUserId(), b.getCreatedAt(), b.getConfirmedAt());
            // 这里以「专家」作为对端展示
            fillCounterpart(r, b.getTrainerUserId(), BindingType.INSTITUTION_TRAINER, false);
            r.setIfInitiator(Objects.equals(b.getInitiatorUserId(), institutionUserId));
            result.add(r);
        }
        result.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listInstitutionEmployees(Integer institutionUserId) {
        if (institutionUserId == null) return List.of();
        Institution inst = institutionRepository.findByUserId(institutionUserId).orElse(null);
        if (inst == null) return List.of();
        List<BindingItemResponse> result = new ArrayList<>();
        for (InstitutionEmployeeBinding b : institutionEmployeeBindingRepository.findByOrgId(inst.getId())) {
            BindingItemResponse r = baseResponse(b.getId(), BindingType.INSTITUTION_EMPLOYEE, b.getStatus(),
                    b.getNote(), b.getRejectReason(), b.getInitiatorUserId(), b.getCreatedAt(), b.getConfirmedAt());
            // 对端展示「员工」
            fillCounterpart(r, b.getEmployeeUserId(), BindingType.INSTITUTION_EMPLOYEE, false);
            r.setIfInitiator(Objects.equals(b.getInitiatorUserId(), institutionUserId));
            result.add(r);
        }
        result.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listEnterpriseAgentTrainers(Integer enterpriseAgentUserId) {
        if (enterpriseAgentUserId == null) return List.of();
        EnterpriseAgent ea = enterpriseAgentRepository.findByUserId(enterpriseAgentUserId).orElse(null);
        if (ea == null) return List.of();
        List<BindingItemResponse> result = new ArrayList<>();
        for (EnterpriseAgentTrainerBinding b : enterpriseAgentTrainerBindingRepository.findByEnterpriseAgentId(ea.getId())) {
            BindingItemResponse r = baseResponse(b.getId(), BindingType.ENTERPRISE_AGENT_TRAINER, b.getStatus(),
                    b.getNote(), b.getRejectReason(), b.getInitiatorUserId(), b.getCreatedAt(), b.getConfirmedAt());
            fillCounterpart(r, b.getTrainerUserId(), BindingType.ENTERPRISE_AGENT_TRAINER, false);
            r.setIfInitiator(Objects.equals(b.getInitiatorUserId(), enterpriseAgentUserId));
            result.add(r);
        }
        result.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listAgentTrainers(Integer agentUserId) {
        if (agentUserId == null) return List.of();
        List<BindingItemResponse> result = new ArrayList<>();
        for (AgentTrainerBinding b : agentTrainerBindingRepository.findByAgentUserId(agentUserId)) {
            BindingItemResponse r = baseResponse(b.getId(), BindingType.AGENT_TRAINER, b.getStatus(),
                    b.getNote(), b.getRejectReason(), b.getInitiatorUserId(), b.getCreatedAt(), b.getConfirmedAt());
            fillCounterpart(r, b.getTrainerUserId(), BindingType.AGENT_TRAINER, false);
            r.setIfInitiator(Objects.equals(b.getInitiatorUserId(), agentUserId));
            result.add(r);
        }
        result.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listAssistantTrainers(Integer assistantUserId) {
        if (assistantUserId == null) return List.of();
        List<BindingItemResponse> result = new ArrayList<>();
        for (TrainerAssistantBinding b : trainerAssistantBindingRepository.findAllByAssistantUserId(assistantUserId)) {
            BindingItemResponse r = baseResponse(b.getId(), BindingType.ASSISTANT_TRAINER, b.getStatus(),
                    b.getNote(), b.getRejectReason(), b.getInitiatorUserId(), b.getCreatedAt(), b.getConfirmedAt());
            fillCounterpart(r, b.getTrainerUserId(), BindingType.ASSISTANT_TRAINER, false);
            r.setIfInitiator(Objects.equals(b.getInitiatorUserId(), assistantUserId));
            result.add(r);
        }
        result.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listEnterpriseAgentMembers(Integer enterpriseAgentUserId) {
        if (enterpriseAgentUserId == null) return List.of();
        EnterpriseAgent ea = enterpriseAgentRepository.findByUserId(enterpriseAgentUserId).orElse(null);
        if (ea == null) return List.of();
        List<BindingItemResponse> result = new ArrayList<>();
        for (EnterpriseAgentMember m : enterpriseAgentMemberRepository.findByEnterpriseAgentId(ea.getId())) {
            BindingItemResponse r = baseResponse(m.getId(), BindingType.ENTERPRISE_AGENT_MEMBER, m.getStatus(),
                    m.getNote(), m.getRejectReason(), m.getInitiatorUserId(), m.getCreatedAt(), m.getConfirmedAt());
            // 对端展示「经纪人」
            fillCounterpart(r, m.getAgentUserId(), BindingType.ENTERPRISE_AGENT_MEMBER, false);
            r.setCounterpartOrgName(ea.getCompanyName());
            r.setIfInitiator(Objects.equals(m.getInitiatorUserId(), enterpriseAgentUserId));
            result.add(r);
        }
        result.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listMyEnterpriseAgents(Integer agentUserId) {
        if (agentUserId == null) return List.of();
        List<BindingItemResponse> result = new ArrayList<>();
        for (EnterpriseAgentMember m : enterpriseAgentMemberRepository.findAllByAgentUserId(agentUserId)) {
            BindingItemResponse r = baseResponse(m.getId(), BindingType.ENTERPRISE_AGENT_MEMBER, m.getStatus(),
                    m.getNote(), m.getRejectReason(), m.getInitiatorUserId(), m.getCreatedAt(), m.getConfirmedAt());
            Integer eaUser = resolveEnterpriseAgentUserId(m.getEnterpriseAgentId());
            fillCounterpart(r, eaUser, BindingType.ENTERPRISE_AGENT_MEMBER, true);
            enterpriseAgentRepository.findById(m.getEnterpriseAgentId())
                    .ifPresent(ea -> r.setCounterpartOrgName(ea.getCompanyName()));
            r.setIfInitiator(Objects.equals(m.getInitiatorUserId(), agentUserId));
            result.add(r);
        }
        result.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listMyInstitutions(Integer employeeUserId) {
        if (employeeUserId == null) return List.of();
        List<BindingItemResponse> result = new ArrayList<>();
        // 查询全状态绑定（不仅 PENDING）
        for (Integer status : new Integer[]{ACTIVE, PENDING, REJECTED, UNBOUND}) {
            for (InstitutionEmployeeBinding b :
                    institutionEmployeeBindingRepository.findByEmployeeUserIdAndStatus(employeeUserId, status)) {
                BindingItemResponse r = baseResponse(b.getId(), BindingType.INSTITUTION_EMPLOYEE, b.getStatus(),
                        b.getNote(), b.getRejectReason(), b.getInitiatorUserId(), b.getCreatedAt(), b.getConfirmedAt());
                Integer instUser = resolveInstitutionUserId(b.getOrgId());
                fillCounterpart(r, instUser, BindingType.INSTITUTION_EMPLOYEE, true);
                institutionRepository.findById(b.getOrgId())
                        .ifPresent(inst -> r.setCounterpartOrgName(inst.getOrgName()));
                r.setIfInitiator(Objects.equals(b.getInitiatorUserId(), employeeUserId));
                result.add(r);
            }
        }
        result.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listManagedTrainers(Integer operatorUserId) {
        Set<Integer> userIds = new java.util.LinkedHashSet<>(bindingAuthorizationService.listManagedTrainerUserIds(operatorUserId));
        // TrainerSwitcher 中「我自己」已单独占位，需把操作者自身从代管列表剔除，
        // 避免双重职业（如同时是 TRAINER + AGENT）的用户看到自己出现两次。
        userIds.remove(operatorUserId);
        if (userIds.isEmpty()) return List.of();
        Map<Integer, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<Integer, Trainer> trainerMap = trainerRepository.findAll().stream()
                .filter(t -> userIds.contains(t.getUserId()))
                .collect(Collectors.toMap(Trainer::getUserId, t -> t));

        List<BindingItemResponse> result = new ArrayList<>();
        for (Integer uid : userIds) {
            BindingItemResponse r = new BindingItemResponse();
            r.setCounterpartUserId(uid);
            r.setCounterpartRole(BusinessRole.TRAINER.name());
            r.setCounterpartRoleLabel(BusinessRole.TRAINER.getLabel());
            User u = userMap.get(uid);
            if (u != null) {
                r.setCounterpartNickname(u.getNickname() != null ? u.getNickname() : u.getRealName());
                r.setCounterpartAvatarUrl(u.getAvatarUrl());
            }
            Trainer t = trainerMap.get(uid);
            if (t != null) {
                r.setId(t.getId()); // 这里用 trainer.id 方便前端按 trainerId 查询资源
            }
            result.add(r);
        }
        return result;
    }

    // ============================================================
    // 确认 / 拒绝 / 解绑
    // ============================================================

    @Override
    @Transactional
    public void confirm(Integer operatorUserId, BindingType type, Integer bindingId) {
        switch (type) {
            case AGENT_TRAINER: {
                AgentTrainerBinding b = mustGetAgent(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(ACTIVE);
                b.setConfirmedAt(LocalDateTime.now());
                agentTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, true,
                        BindingType.AGENT_TRAINER, "经纪人绑定", null);
                break;
            }
            case ASSISTANT_TRAINER: {
                TrainerAssistantBinding b = mustGetAssistant(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(ACTIVE);
                b.setConfirmedAt(LocalDateTime.now());
                trainerAssistantBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, true,
                        BindingType.ASSISTANT_TRAINER, "助理绑定", null);
                break;
            }
            case INSTITUTION_TRAINER: {
                InstitutionTrainerBinding b = mustGetInstitutionTrainer(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(ACTIVE);
                b.setConfirmedAt(LocalDateTime.now());
                institutionTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, true,
                        BindingType.INSTITUTION_TRAINER, "机构绑定", null);
                break;
            }
            case ENTERPRISE_AGENT_TRAINER: {
                EnterpriseAgentTrainerBinding b = mustGetEnterpriseAgentTrainer(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(ACTIVE);
                b.setConfirmedAt(LocalDateTime.now());
                enterpriseAgentTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, true,
                        BindingType.ENTERPRISE_AGENT_TRAINER, "经纪公司绑定", null);
                break;
            }
            case INSTITUTION_EMPLOYEE: {
                InstitutionEmployeeBinding b = mustGetEmployee(bindingId);
                requireEmployeeBindingConfirmer(operatorUserId, b);
                requirePending(b.getStatus());
                b.setStatus(ACTIVE);
                b.setConfirmedAt(LocalDateTime.now());
                institutionEmployeeBindingRepository.save(b);
                // 员工主动申请：机构确认后给员工授角色
                if (Objects.equals(b.getInitiatorUserId(), b.getEmployeeUserId())) {
                    grantBusinessRoleIfAbsent(b.getEmployeeUserId(), BusinessRole.Code.INSTITUTION_EMPLOYEE);
                }
                notifyResult(b.getInitiatorUserId(), operatorUserId, true,
                        BindingType.INSTITUTION_EMPLOYEE, "机构员工绑定", null);
                break;
            }
            case ENTERPRISE_AGENT_MEMBER: {
                EnterpriseAgentMember m = mustGetEnterpriseAgentMember(bindingId);
                requireEnterpriseAgentMemberConfirmer(operatorUserId, m);
                requirePending(m.getStatus());
                m.setStatus(ACTIVE);
                m.setConfirmedAt(LocalDateTime.now());
                enterpriseAgentMemberRepository.save(m);
                // 经纪人主动申请：经纪公司确认后给经纪人授角色
                if (Objects.equals(m.getInitiatorUserId(), m.getAgentUserId())) {
                    grantBusinessRoleIfAbsent(m.getAgentUserId(), BusinessRole.Code.AGENT);
                }
                notifyResult(m.getInitiatorUserId(), operatorUserId, true,
                        BindingType.ENTERPRISE_AGENT_MEMBER, "经纪公司成员关系", null);
                break;
            }
            default:
                throw new BusinessException(ErrorCode.PARAM_INVALID);
        }
    }

    @Override
    @Transactional
    public void reject(Integer operatorUserId, BindingType type, Integer bindingId, String reason) {
        switch (type) {
            case AGENT_TRAINER: {
                AgentTrainerBinding b = mustGetAgent(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(REJECTED);
                b.setRejectReason(reason);
                agentTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, false,
                        BindingType.AGENT_TRAINER, "经纪人绑定", reason);
                break;
            }
            case ASSISTANT_TRAINER: {
                TrainerAssistantBinding b = mustGetAssistant(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(REJECTED);
                b.setRejectReason(reason);
                trainerAssistantBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, false,
                        BindingType.ASSISTANT_TRAINER, "助理绑定", reason);
                break;
            }
            case INSTITUTION_TRAINER: {
                InstitutionTrainerBinding b = mustGetInstitutionTrainer(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(REJECTED);
                b.setRejectReason(reason);
                institutionTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, false,
                        BindingType.INSTITUTION_TRAINER, "机构绑定", reason);
                break;
            }
            case ENTERPRISE_AGENT_TRAINER: {
                EnterpriseAgentTrainerBinding b = mustGetEnterpriseAgentTrainer(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(REJECTED);
                b.setRejectReason(reason);
                enterpriseAgentTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, false,
                        BindingType.ENTERPRISE_AGENT_TRAINER, "经纪公司绑定", reason);
                break;
            }
            case INSTITUTION_EMPLOYEE: {
                InstitutionEmployeeBinding b = mustGetEmployee(bindingId);
                requireEmployeeBindingConfirmer(operatorUserId, b);
                requirePending(b.getStatus());
                b.setStatus(REJECTED);
                b.setRejectReason(reason);
                institutionEmployeeBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, false,
                        BindingType.INSTITUTION_EMPLOYEE, "机构员工绑定", reason);
                break;
            }
            case ENTERPRISE_AGENT_MEMBER: {
                EnterpriseAgentMember m = mustGetEnterpriseAgentMember(bindingId);
                requireEnterpriseAgentMemberConfirmer(operatorUserId, m);
                requirePending(m.getStatus());
                m.setStatus(REJECTED);
                m.setRejectReason(reason);
                enterpriseAgentMemberRepository.save(m);
                notifyResult(m.getInitiatorUserId(), operatorUserId, false,
                        BindingType.ENTERPRISE_AGENT_MEMBER, "经纪公司成员关系", reason);
                break;
            }
            default:
                throw new BusinessException(ErrorCode.PARAM_INVALID);
        }
    }

    @Override
    @Transactional
    public void unbind(Integer operatorUserId, BindingType type, Integer bindingId) {
        switch (type) {
            case AGENT_TRAINER: {
                AgentTrainerBinding b = mustGetAgent(bindingId);
                requireOneOfParties(operatorUserId, b.getAgentUserId(), b.getTrainerUserId());
                b.setStatus(UNBOUND);
                agentTrainerBindingRepository.save(b);
                break;
            }
            case ASSISTANT_TRAINER: {
                TrainerAssistantBinding b = mustGetAssistant(bindingId);
                requireOneOfParties(operatorUserId, b.getAssistantUserId(), b.getTrainerUserId());
                b.setStatus(UNBOUND);
                trainerAssistantBindingRepository.save(b);
                break;
            }
            case INSTITUTION_TRAINER: {
                InstitutionTrainerBinding b = mustGetInstitutionTrainer(bindingId);
                Integer instUser = resolveInstitutionUserId(b.getOrgId());
                requireOneOfParties(operatorUserId, instUser, b.getTrainerUserId());
                b.setStatus(UNBOUND);
                institutionTrainerBindingRepository.save(b);
                break;
            }
            case ENTERPRISE_AGENT_TRAINER: {
                EnterpriseAgentTrainerBinding b = mustGetEnterpriseAgentTrainer(bindingId);
                Integer eaUser = resolveEnterpriseAgentUserId(b.getEnterpriseAgentId());
                requireOneOfParties(operatorUserId, eaUser, b.getTrainerUserId());
                b.setStatus(UNBOUND);
                enterpriseAgentTrainerBindingRepository.save(b);
                break;
            }
            case INSTITUTION_EMPLOYEE: {
                InstitutionEmployeeBinding b = mustGetEmployee(bindingId);
                Integer instUser = resolveInstitutionUserId(b.getOrgId());
                requireOneOfParties(operatorUserId, instUser, b.getEmployeeUserId());
                b.setStatus(UNBOUND);
                institutionEmployeeBindingRepository.save(b);
                break;
            }
            case ENTERPRISE_AGENT_MEMBER: {
                EnterpriseAgentMember m = mustGetEnterpriseAgentMember(bindingId);
                Integer eaUser = resolveEnterpriseAgentUserId(m.getEnterpriseAgentId());
                requireOneOfParties(operatorUserId, eaUser, m.getAgentUserId());
                m.setStatus(UNBOUND);
                enterpriseAgentMemberRepository.save(m);
                break;
            }
            default:
                throw new BusinessException(ErrorCode.PARAM_INVALID);
        }
    }

    // ============================================================
    // 私有辅助
    // ============================================================

    private AgentTrainerBinding mustGetAgent(Integer id) {
        return agentTrainerBindingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "绑定记录不存在"));
    }

    private TrainerAssistantBinding mustGetAssistant(Integer id) {
        return trainerAssistantBindingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "绑定记录不存在"));
    }

    private InstitutionTrainerBinding mustGetInstitutionTrainer(Integer id) {
        return institutionTrainerBindingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "绑定记录不存在"));
    }

    private EnterpriseAgentTrainerBinding mustGetEnterpriseAgentTrainer(Integer id) {
        return enterpriseAgentTrainerBindingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "绑定记录不存在"));
    }

    private InstitutionEmployeeBinding mustGetEmployee(Integer id) {
        return institutionEmployeeBindingRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "绑定记录不存在"));
    }

    private EnterpriseAgentMember mustGetEnterpriseAgentMember(Integer id) {
        return enterpriseAgentMemberRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "绑定记录不存在"));
    }

    private void requireTrainerOwner(Integer operatorUserId, Integer trainerUserId) {
        if (!Objects.equals(operatorUserId, trainerUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "只有专家本人可以确认/拒绝绑定");
        }
    }

    /**
     * 机构员工绑定的确认方校验：
     * <ul>
     *   <li>若发起方是机构 → 由员工本人确认 / 拒绝</li>
     *   <li>若发起方是员工 → 由机构主体（orgId 对应的 user_id）确认 / 拒绝</li>
     * </ul>
     */
    private void requireEmployeeBindingConfirmer(Integer operatorUserId, InstitutionEmployeeBinding b) {
        Integer instUser = resolveInstitutionUserId(b.getOrgId());
        // 历史/兼容：initiator_user_id 缺失时，机构与员工任一方均可处理（避免老数据卡住）
        if (b.getInitiatorUserId() == null) {
            if (Objects.equals(operatorUserId, instUser) || Objects.equals(operatorUserId, b.getEmployeeUserId())) {
                return;
            }
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权处理该绑定");
        }
        if (Objects.equals(b.getInitiatorUserId(), b.getEmployeeUserId())) {
            // 员工主动申请：必须是机构主体
            if (!Objects.equals(operatorUserId, instUser)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "只有机构主体可以处理员工申请");
            }
            return;
        }
        // 机构主动邀请：由员工本人确认
        if (!Objects.equals(b.getEmployeeUserId(), operatorUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权处理该绑定");
        }
    }

    private void requireEnterpriseAgentMemberConfirmer(Integer operatorUserId, EnterpriseAgentMember m) {
        Integer eaUser = resolveEnterpriseAgentUserId(m.getEnterpriseAgentId());
        // 历史/兼容：initiator_user_id 缺失时，经纪公司与经纪人任一方均可处理
        if (m.getInitiatorUserId() == null) {
            if (Objects.equals(operatorUserId, eaUser) || Objects.equals(operatorUserId, m.getAgentUserId())) {
                return;
            }
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权处理该绑定");
        }
        if (Objects.equals(m.getInitiatorUserId(), m.getAgentUserId())) {
            // 经纪人主动申请：必须是经纪公司负责人
            if (!Objects.equals(operatorUserId, eaUser)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "只有经纪公司可以处理经纪人申请");
            }
            return;
        }
        // 经纪公司发起：由经纪人本人确认
        if (!Objects.equals(m.getAgentUserId(), operatorUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权处理该绑定");
        }
    }

    /**
     * 给用户授予指定业务角色：若不存在记录则新增 status=1，若存在则将 status 改为 1。
     */
    private void grantBusinessRoleIfAbsent(Integer userId, String roleCode) {
        if (userId == null || roleCode == null) return;
        UserRole ur = userRoleRepository.findByUserIdAndRole(userId, roleCode).orElse(null);
        if (ur == null) {
            ur = new UserRole();
            ur.setUserId(userId);
            ur.setRole(roleCode);
            ur.setStatus(1);
            ur.setApprovedAt(LocalDateTime.now());
            ur.setRejectReason(null);
            userRoleRepository.save(ur);
            return;
        }
        if (Objects.equals(ur.getStatus(), 1)) {
            return;
        }
        ur.setStatus(1);
        ur.setRejectReason(null);
        ur.setApprovedAt(LocalDateTime.now());
        userRoleRepository.save(ur);
    }

    private void requirePending(Integer status) {
        if (status == null || status != PENDING) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "绑定状态不允许此操作");
        }
    }

    private void requireOneOfParties(Integer operatorUserId, Integer p1, Integer p2) {
        if (!Objects.equals(operatorUserId, p1) && !Objects.equals(operatorUserId, p2)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权解除该绑定");
        }
    }

    private Integer resolveInstitutionUserId(Integer orgId) {
        return institutionRepository.findById(orgId).map(Institution::getUserId).orElse(null);
    }

    private Integer resolveEnterpriseAgentUserId(Integer eaId) {
        return enterpriseAgentRepository.findById(eaId).map(EnterpriseAgent::getUserId).orElse(null);
    }

    // ============================================================
    // 通知
    // ============================================================

    /**
     * 接收方收到的"绑定请求"通知。
     * <p>
     * 文案模版：「{发起方角色文案} {orgName} 的「{发起人姓名}」{动作文案}，前往处理。」
     * 缺省 orgName 时降级为：「{发起方角色文案}「{发起人姓名}」{动作文案}」。
     *
     * @param toUserId   接收方
     * @param fromUserId 发起方用户 ID
     * @param type       绑定类型（决定动作文案 + 跳转路由）
     * @param orgName    发起方机构 / 公司名称（机构、经纪公司发起时填）；为 null 时走简版文案
     */
    private void notifyBindingRequest(Integer toUserId, Integer fromUserId, BindingType type, String orgName) {
        if (toUserId == null) return;
        String fromName = fetchNickname(fromUserId);
        String content = buildBindingRequestContent(type, orgName, fromName);
        notificationService.send(
                toUserId,
                NotificationType.BINDING_REQUEST,
                "新的绑定请求",
                content,
                null,
                receiverRouteFor(type));
    }

    /**
     * 员工主动申请加入机构 — 通知机构主体审核。
     */
    private void notifyEmployeeApplication(Integer toInstUserId, Integer employeeUserId, String orgName) {
        if (toInstUserId == null) return;
        String employeeName = fetchNickname(employeeUserId);
        String content = orgName != null && !orgName.isBlank()
                ? String.format("「%s」申请加入您的机构「%s」，前往处理。", employeeName, orgName)
                : String.format("「%s」申请加入您的机构，前往处理。", employeeName);
        notificationService.send(
                toInstUserId,
                NotificationType.BINDING_REQUEST,
                "新的员工入驻申请",
                content,
                null,
                "/dashboard/my-employees?tab=pending-review");
    }

    /**
     * 经纪人主动申请加入经纪公司 — 通知经纪公司负责人审核。
     */
    private void notifyAgentApplication(Integer toEnterpriseUserId, Integer agentUserId, String companyName) {
        if (toEnterpriseUserId == null) return;
        String agentName = fetchNickname(agentUserId);
        String content = companyName != null && !companyName.isBlank()
                ? String.format("「%s」申请加入您的经纪公司「%s」，前往处理。", agentName, companyName)
                : String.format("「%s」申请加入您的经纪公司，前往处理。", agentName);
        notificationService.send(
                toEnterpriseUserId,
                NotificationType.BINDING_REQUEST,
                "新的经纪人入驻申请",
                content,
                null,
                "/dashboard/my-agents-team?tab=pending-review");
    }

    private void notifyResult(Integer toUserId, Integer fromUserId, boolean accepted,
                              BindingType type, String topic, String reason) {
        if (toUserId == null) return;
        String fromName = fetchNickname(fromUserId);
        String title = accepted ? "绑定请求已通过" : "绑定请求被拒绝";
        String content = accepted
                ? String.format("您发起的「%s」请求已被「%s」确认，前往查看。", topic, fromName)
                : String.format("您发起的「%s」请求被「%s」拒绝。%s",
                topic, fromName, reason != null && !reason.isBlank() ? "理由：" + reason : "");
        notificationService.send(toUserId, NotificationType.BINDING_RESULT, title, content,
                null, initiatorRouteFor(type, fromUserId));
    }

    /**
     * 根据绑定类型为接收方生成 relatedUrl（接收方角色侧的列表页）。
     */
    private String receiverRouteFor(BindingType type) {
        if (type == null) return "/dashboard/my-agents";
        switch (type) {
            case AGENT_TRAINER:
            case ASSISTANT_TRAINER:
            case INSTITUTION_TRAINER:
            case ENTERPRISE_AGENT_TRAINER:
                // 接收方是专家
                return "/dashboard/my-agents";
            case INSTITUTION_EMPLOYEE:
                // 接收方是员工
                return "/dashboard/my-institution";
            case ENTERPRISE_AGENT_MEMBER:
                // 接收方是经纪人
                return "/dashboard/my-enterprise-agent";
            default:
                return null;
        }
    }

    /**
     * 根据绑定类型为发起方生成结果通知 relatedUrl（发起方角色侧的列表页）。
     */
    private String initiatorRouteFor(BindingType type, Integer initiatorUserId) {
        if (type == null) return null;
        switch (type) {
            case AGENT_TRAINER:
                return "/dashboard/my-experts";
            case ASSISTANT_TRAINER:
                return "/dashboard/my-experts";
            case INSTITUTION_TRAINER:
                return "/dashboard/my-experts";
            case ENTERPRISE_AGENT_TRAINER:
                return "/dashboard/my-experts";
            case INSTITUTION_EMPLOYEE:
                return "/dashboard/my-employees";
            case ENTERPRISE_AGENT_MEMBER:
                return "/dashboard/my-agents-team";
            default:
                return null;
        }
    }

    /**
     * 根据绑定类型生成接收方收到的请求文案：
     * 「{发起方角色文案} {orgName} 的「{发起人}」{动作}，前往处理。」
     */
    private String buildBindingRequestContent(BindingType type, String orgName, String fromName) {
        String roleLabel = roleLabelOf(type);
        String verb = inviteVerbOf(type);
        if (orgName != null && !orgName.isBlank()) {
            return String.format("%s「%s」的「%s」%s，前往处理。", roleLabel, orgName, fromName, verb);
        }
        return String.format("%s「%s」%s，前往处理。", roleLabel, fromName, verb);
    }

    private String roleLabelOf(BindingType type) {
        if (type == null) return "用户";
        switch (type) {
            case AGENT_TRAINER:
                return "专家经纪人";
            case ASSISTANT_TRAINER:
                return "专家助理";
            case INSTITUTION_TRAINER:
                return "培训机构";
            case ENTERPRISE_AGENT_TRAINER:
                return "专家经纪公司";
            case INSTITUTION_EMPLOYEE:
                return "培训机构";
            case ENTERPRISE_AGENT_MEMBER:
                return "专家经纪公司";
            default:
                return "用户";
        }
    }

    private String inviteVerbOf(BindingType type) {
        if (type == null) return "向您发起绑定请求";
        switch (type) {
            case AGENT_TRAINER:
            case ASSISTANT_TRAINER:
                return "邀请您绑定为合作专家";
            case INSTITUTION_TRAINER:
            case ENTERPRISE_AGENT_TRAINER:
                return "邀请您成为旗下合作专家";
            case INSTITUTION_EMPLOYEE:
                return "邀请您成为员工";
            case ENTERPRISE_AGENT_MEMBER:
                return "邀请您加入旗下经纪人";
            default:
                return "向您发起绑定请求";
        }
    }

    private String fetchNickname(Integer userId) {
        if (userId == null) return "未知用户";
        return userRepository.findById(userId)
                .map(u -> u.getNickname() != null && !u.getNickname().isBlank()
                        ? u.getNickname() : (u.getRealName() != null ? u.getRealName() : ("用户#" + userId)))
                .orElse("用户#" + userId);
    }

    // ============================================================
    // DTO 转换
    // ============================================================

    private BindingItemResponse toResponse(AgentTrainerBinding b, BindingType type,
                                           Integer counterpartUserId, Integer trainerUserId) {
        BindingItemResponse r = baseResponse(b.getId(), type, b.getStatus(),
                b.getNote(), b.getRejectReason(), b.getInitiatorUserId(),
                b.getCreatedAt(), b.getConfirmedAt());
        fillCounterpart(r, counterpartUserId, type, true);
        return r;
    }

    private BindingItemResponse toResponse(TrainerAssistantBinding b, BindingType type,
                                           Integer counterpartUserId, Integer trainerUserId) {
        BindingItemResponse r = baseResponse(b.getId(), type, b.getStatus(),
                b.getNote(), b.getRejectReason(), b.getInitiatorUserId(),
                b.getCreatedAt(), b.getConfirmedAt());
        fillCounterpart(r, counterpartUserId, type, true);
        return r;
    }

    private BindingItemResponse toResponse(InstitutionTrainerBinding b, BindingType type,
                                           Integer counterpartUserId, Integer trainerUserId) {
        BindingItemResponse r = baseResponse(b.getId(), type, b.getStatus(),
                b.getNote(), b.getRejectReason(), b.getInitiatorUserId(),
                b.getCreatedAt(), b.getConfirmedAt());
        fillCounterpart(r, counterpartUserId, type, true);
        // 机构组织名补充
        institutionRepository.findById(b.getOrgId()).ifPresent(inst -> r.setCounterpartOrgName(inst.getOrgName()));
        return r;
    }

    private BindingItemResponse toResponse(EnterpriseAgentTrainerBinding b, BindingType type,
                                           Integer counterpartUserId, Integer trainerUserId) {
        BindingItemResponse r = baseResponse(b.getId(), type, b.getStatus(),
                b.getNote(), b.getRejectReason(), b.getInitiatorUserId(),
                b.getCreatedAt(), b.getConfirmedAt());
        fillCounterpart(r, counterpartUserId, type, true);
        enterpriseAgentRepository.findById(b.getEnterpriseAgentId())
                .ifPresent(ea -> r.setCounterpartOrgName(ea.getCompanyName()));
        return r;
    }

    private BindingItemResponse toResponse(InstitutionEmployeeBinding b, BindingType type,
                                           Integer counterpartUserId, Integer employeeUserId) {
        BindingItemResponse r = baseResponse(b.getId(), type, b.getStatus(),
                b.getNote(), b.getRejectReason(), b.getInitiatorUserId(),
                b.getCreatedAt(), b.getConfirmedAt());
        fillCounterpart(r, counterpartUserId, type, false);
        institutionRepository.findById(b.getOrgId()).ifPresent(inst -> r.setCounterpartOrgName(inst.getOrgName()));
        return r;
    }

    private BindingItemResponse toResponse(EnterpriseAgentMember m, BindingType type,
                                           Integer counterpartUserId, Integer agentUserId) {
        BindingItemResponse r = baseResponse(m.getId(), type, m.getStatus(),
                m.getNote(), m.getRejectReason(), m.getInitiatorUserId(),
                m.getCreatedAt(), m.getConfirmedAt());
        fillCounterpart(r, counterpartUserId, type, true);
        enterpriseAgentRepository.findById(m.getEnterpriseAgentId())
                .ifPresent(ea -> r.setCounterpartOrgName(ea.getCompanyName()));
        return r;
    }

    private BindingItemResponse baseResponse(Integer id, BindingType type, Integer status,
                                             String note, String rejectReason, Integer initiatorUserId,
                                             LocalDateTime createdAt, LocalDateTime confirmedAt) {
        BindingItemResponse r = new BindingItemResponse();
        r.setId(id);
        r.setBindingType(type);
        r.setStatus(status);
        r.setStatusLabel(BindingStatus.fromCode(status).getLabel());
        r.setNote(note);
        r.setRejectReason(rejectReason);
        r.setInitiatorUserId(initiatorUserId);
        r.setCreatedAt(createdAt);
        r.setConfirmedAt(confirmedAt);
        return r;
    }

    private void fillCounterpart(BindingItemResponse r, Integer counterpartUserId,
                                 BindingType type, boolean counterpartIsRoleSide) {
        r.setCounterpartUserId(counterpartUserId);
        BusinessRole role = inferCounterpartRole(type, counterpartIsRoleSide);
        if (role != null) {
            r.setCounterpartRole(role.name());
            r.setCounterpartRoleLabel(role.getLabel());
        }
        if (counterpartUserId != null) {
            userRepository.findById(counterpartUserId).ifPresent(u -> {
                r.setCounterpartNickname(u.getNickname() != null && !u.getNickname().isBlank()
                        ? u.getNickname() : u.getRealName());
                r.setCounterpartAvatarUrl(u.getAvatarUrl());
            });
        }
    }

    private BusinessRole inferCounterpartRole(BindingType type, boolean counterpartIsRoleSide) {
        switch (type) {
            case AGENT_TRAINER:
                return counterpartIsRoleSide ? BusinessRole.AGENT : BusinessRole.TRAINER;
            case ASSISTANT_TRAINER:
                return counterpartIsRoleSide ? BusinessRole.ASSISTANT : BusinessRole.TRAINER;
            case INSTITUTION_TRAINER:
                return counterpartIsRoleSide ? BusinessRole.INSTITUTION : BusinessRole.TRAINER;
            case ENTERPRISE_AGENT_TRAINER:
                return counterpartIsRoleSide ? BusinessRole.ENTERPRISE_AGENT : BusinessRole.TRAINER;
            case INSTITUTION_EMPLOYEE:
                return counterpartIsRoleSide ? BusinessRole.INSTITUTION : BusinessRole.INSTITUTION_EMPLOYEE;
            case ENTERPRISE_AGENT_MEMBER:
                return counterpartIsRoleSide ? BusinessRole.ENTERPRISE_AGENT : BusinessRole.AGENT;
            default:
                return null;
        }
    }
}
