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
    private final BindingAuthorizationService bindingAuthorizationService;
    private final NotificationService notificationService;

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
            throw new BusinessException(ErrorCode.PARAM_INVALID, "不能向自己发起绑定");
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
            default:
                throw new BusinessException(ErrorCode.PARAM_INVALID, "未知的绑定类型");
        }
    }

    private BindingItemResponse initiateAgentTrainer(Integer agentUserId, Integer trainerUserId, String note) {
        requireTargetIsTrainer(trainerUserId);
        AgentTrainerBinding b = agentTrainerBindingRepository
                .findByAgentUserIdAndTrainerUserId(agentUserId, trainerUserId)
                .orElseGet(AgentTrainerBinding::new);
        if (b.getStatus() != null && Objects.equals(b.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的绑定");
        }
        b.setAgentUserId(agentUserId);
        b.setTrainerUserId(trainerUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(agentUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        agentTrainerBindingRepository.save(b);
        sendBindingRequestNotification(trainerUserId, agentUserId, "经纪人");
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
        if (b.getStatus() != null && Objects.equals(b.getStatus(), ACTIVE)
                && !Objects.equals(b.getAssistantUserId(), assistantUserId)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "目标专家已绑定其他助理");
        }
        b.setTrainerUserId(trainerUserId);
        b.setAssistantUserId(assistantUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(assistantUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        trainerAssistantBindingRepository.save(b);
        sendBindingRequestNotification(trainerUserId, assistantUserId, "助理");
        return toResponse(b, BindingType.ASSISTANT_TRAINER, assistantUserId, trainerUserId);
    }

    private BindingItemResponse initiateInstitutionTrainer(Integer operatorUserId, Integer trainerUserId, String note) {
        Institution inst = institutionRepository.findByUserId(operatorUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是机构主体"));
        requireTargetIsTrainer(trainerUserId);
        InstitutionTrainerBinding b = institutionTrainerBindingRepository
                .findByOrgIdAndTrainerUserId(inst.getId(), trainerUserId)
                .orElseGet(InstitutionTrainerBinding::new);
        if (b.getStatus() != null && Objects.equals(b.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的绑定");
        }
        b.setOrgId(inst.getId());
        b.setTrainerUserId(trainerUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(operatorUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        institutionTrainerBindingRepository.save(b);
        sendBindingRequestNotification(trainerUserId, operatorUserId, "培训机构");
        return toResponse(b, BindingType.INSTITUTION_TRAINER, operatorUserId, trainerUserId);
    }

    private BindingItemResponse initiateEnterpriseAgentTrainer(Integer operatorUserId, Integer trainerUserId, String note) {
        EnterpriseAgent ea = enterpriseAgentRepository.findByUserId(operatorUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是经纪公司负责人"));
        requireTargetIsTrainer(trainerUserId);
        EnterpriseAgentTrainerBinding b = enterpriseAgentTrainerBindingRepository
                .findByEnterpriseAgentIdAndTrainerUserId(ea.getId(), trainerUserId)
                .orElseGet(EnterpriseAgentTrainerBinding::new);
        if (b.getStatus() != null && Objects.equals(b.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的绑定");
        }
        b.setEnterpriseAgentId(ea.getId());
        b.setTrainerUserId(trainerUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(operatorUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        enterpriseAgentTrainerBindingRepository.save(b);
        sendBindingRequestNotification(trainerUserId, operatorUserId, "经纪公司");
        return toResponse(b, BindingType.ENTERPRISE_AGENT_TRAINER, operatorUserId, trainerUserId);
    }

    private BindingItemResponse initiateInstitutionEmployee(Integer operatorUserId, Integer employeeUserId, String note) {
        Institution inst = institutionRepository.findByUserId(operatorUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是机构主体"));
        InstitutionEmployeeBinding b = institutionEmployeeBindingRepository
                .findByOrgIdAndEmployeeUserId(inst.getId(), employeeUserId)
                .orElseGet(InstitutionEmployeeBinding::new);
        if (b.getStatus() != null && Objects.equals(b.getStatus(), ACTIVE)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "已存在生效的绑定");
        }
        b.setOrgId(inst.getId());
        b.setEmployeeUserId(employeeUserId);
        b.setStatus(PENDING);
        b.setNote(note);
        b.setInitiatorUserId(operatorUserId);
        b.setRejectReason(null);
        b.setConfirmedAt(null);
        institutionEmployeeBindingRepository.save(b);
        sendBindingRequestNotification(employeeUserId, operatorUserId, "培训机构");
        return toResponse(b, BindingType.INSTITUTION_EMPLOYEE, operatorUserId, employeeUserId);
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
            r.setIAmInitiator(Objects.equals(b.getInitiatorUserId(), institutionUserId));
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
            r.setIAmInitiator(Objects.equals(b.getInitiatorUserId(), institutionUserId));
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
            r.setIAmInitiator(Objects.equals(b.getInitiatorUserId(), enterpriseAgentUserId));
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
            r.setIAmInitiator(Objects.equals(b.getInitiatorUserId(), agentUserId));
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
            r.setIAmInitiator(Objects.equals(b.getInitiatorUserId(), assistantUserId));
            result.add(r);
        }
        result.sort(Comparator.comparing(BindingItemResponse::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BindingItemResponse> listManagedTrainers(Integer operatorUserId) {
        Set<Integer> userIds = bindingAuthorizationService.listManagedTrainerUserIds(operatorUserId);
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
                notifyResult(b.getInitiatorUserId(), operatorUserId, true, "经纪人绑定", null);
                break;
            }
            case ASSISTANT_TRAINER: {
                TrainerAssistantBinding b = mustGetAssistant(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(ACTIVE);
                b.setConfirmedAt(LocalDateTime.now());
                trainerAssistantBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, true, "助理绑定", null);
                break;
            }
            case INSTITUTION_TRAINER: {
                InstitutionTrainerBinding b = mustGetInstitutionTrainer(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(ACTIVE);
                b.setConfirmedAt(LocalDateTime.now());
                institutionTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, true, "机构绑定", null);
                break;
            }
            case ENTERPRISE_AGENT_TRAINER: {
                EnterpriseAgentTrainerBinding b = mustGetEnterpriseAgentTrainer(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(ACTIVE);
                b.setConfirmedAt(LocalDateTime.now());
                enterpriseAgentTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, true, "经纪公司绑定", null);
                break;
            }
            case INSTITUTION_EMPLOYEE: {
                InstitutionEmployeeBinding b = mustGetEmployee(bindingId);
                if (!Objects.equals(b.getEmployeeUserId(), operatorUserId)) {
                    throw new BusinessException(ErrorCode.FORBIDDEN, "无权确认该绑定");
                }
                requirePending(b.getStatus());
                b.setStatus(ACTIVE);
                b.setConfirmedAt(LocalDateTime.now());
                institutionEmployeeBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, true, "机构员工绑定", null);
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
                notifyResult(b.getInitiatorUserId(), operatorUserId, false, "经纪人绑定", reason);
                break;
            }
            case ASSISTANT_TRAINER: {
                TrainerAssistantBinding b = mustGetAssistant(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(REJECTED);
                b.setRejectReason(reason);
                trainerAssistantBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, false, "助理绑定", reason);
                break;
            }
            case INSTITUTION_TRAINER: {
                InstitutionTrainerBinding b = mustGetInstitutionTrainer(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(REJECTED);
                b.setRejectReason(reason);
                institutionTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, false, "机构绑定", reason);
                break;
            }
            case ENTERPRISE_AGENT_TRAINER: {
                EnterpriseAgentTrainerBinding b = mustGetEnterpriseAgentTrainer(bindingId);
                requireTrainerOwner(operatorUserId, b.getTrainerUserId());
                requirePending(b.getStatus());
                b.setStatus(REJECTED);
                b.setRejectReason(reason);
                enterpriseAgentTrainerBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, false, "经纪公司绑定", reason);
                break;
            }
            case INSTITUTION_EMPLOYEE: {
                InstitutionEmployeeBinding b = mustGetEmployee(bindingId);
                if (!Objects.equals(b.getEmployeeUserId(), operatorUserId)) {
                    throw new BusinessException(ErrorCode.FORBIDDEN, "无权拒绝该绑定");
                }
                requirePending(b.getStatus());
                b.setStatus(REJECTED);
                b.setRejectReason(reason);
                institutionEmployeeBindingRepository.save(b);
                notifyResult(b.getInitiatorUserId(), operatorUserId, false, "机构员工绑定", reason);
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

    private void requireTrainerOwner(Integer operatorUserId, Integer trainerUserId) {
        if (!Objects.equals(operatorUserId, trainerUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "只有专家本人可以确认/拒绝绑定");
        }
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

    private void sendBindingRequestNotification(Integer toUserId, Integer fromUserId, String roleLabel) {
        if (toUserId == null) return;
        String fromName = fetchNickname(fromUserId);
        notificationService.send(
                toUserId,
                NotificationType.BINDING_REQUEST,
                "新的绑定请求",
                String.format("%s「%s」向您发起绑定请求，请前往「我的代理」处理。", roleLabel, fromName),
                null,
                "/dashboard/my-agents");
    }

    private void notifyResult(Integer toUserId, Integer fromUserId, boolean accepted, String topic, String reason) {
        if (toUserId == null) return;
        String fromName = fetchNickname(fromUserId);
        String title = accepted ? "绑定请求已通过" : "绑定请求被拒绝";
        String content = accepted
                ? String.format("您发起的「%s」请求已被「%s」确认。", topic, fromName)
                : String.format("您发起的「%s」请求被「%s」拒绝。%s",
                topic, fromName, reason != null && !reason.isBlank() ? "理由：" + reason : "");
        notificationService.send(toUserId, NotificationType.BINDING_RESULT, title, content, null, null);
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
            default:
                return null;
        }
    }
}
