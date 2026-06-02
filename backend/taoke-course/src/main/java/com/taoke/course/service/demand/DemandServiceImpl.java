package com.taoke.course.service.demand;

import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.common.events.course.DemandStatusChangedEvent;
import com.taoke.course.api.DemandService;
import com.taoke.course.dto.demand.*;
import com.taoke.course.entity.demand.Demand;
import com.taoke.course.entity.demand.DemandFollowUp;
import com.taoke.course.enums.DemandStatus;
import com.taoke.course.enums.DemandType;
import com.taoke.course.enums.FollowUpAction;
import com.taoke.course.repository.demand.DemandFollowUpRepository;
import com.taoke.course.repository.demand.DemandRepository;
import com.taoke.user.api.EnterpriseBuyerService;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 培训需求服务实现
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DemandServiceImpl implements DemandService {

    private final DemandRepository demandRepository;
    private final DemandFollowUpRepository followUpRepository;
    private final EnterpriseBuyerService enterpriseBuyerService;
    private final EventPublisher eventPublisher;

    // ==================== C 端操作 ====================

    @Override
    @Transactional
    public DemandDetailResponse create(Integer userId, CreateDemandRequest req) {
        // 校验需求类型
        DemandType demandType;
        try {
            demandType = DemandType.valueOf(req.getDemandType());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "无效的需求类型: " + req.getDemandType());
        }

        // 查询企业采购方信息（如已有则关联）
        Integer enterpriseId = null;
        try {
            EnterpriseBuyerResponse buyer = enterpriseBuyerService.getByUserId(userId);
            if (buyer != null) {
                enterpriseId = buyer.getId();
            }
        } catch (Exception ignored) {
            // 非企业采购者，enterpriseId 为空
        }

        // 创建需求实体
        Demand demand = new Demand();
        demand.setUserId(userId);
        demand.setEnterpriseId(enterpriseId);
        demand.setDemandType(req.getDemandType());
        demand.setTitle(req.getTitle());
        demand.setTrainingTopic(req.getTrainingTopic());
        demand.setTraineeCount(req.getTraineeCount());
        demand.setBudgetMin(req.getBudgetMin());
        demand.setBudgetMax(req.getBudgetMax());
        demand.setExpectedStartDate(req.getExpectedStartDate());
        demand.setFormat(req.getFormat());
        demand.setCourseType(req.getCourseType());
        demand.setIntendedTrainer(req.getIntendedTrainer());
        demand.setDescription(req.getDescription());
        demand.setSourceCaseId(req.getSourceCaseId());
        demand.setSourceCourseId(req.getSourceCourseId());
        demand.setContactName(req.getContactName());
        demand.setContactPhone(req.getContactPhone());
        demand.setProvinceId(req.getProvinceId());
        demand.setCityId(req.getCityId());
        demand.setDistrictId(req.getDistrictId());
        demand.setStatus(DemandStatus.SUBMITTED.getValue());
        demandRepository.save(demand);

        // 写入初始跟进记录
        createFollowUp(demand.getId(), userId, FollowUpAction.STATUS_CHANGE,
                "提交需求", null, DemandStatus.SUBMITTED.getValue());

        log.info("用户 {} 提交了{}需求, demandId={}", userId, demandType.getLabel(), demand.getId());
        return buildDetail(demand);
    }

    @Override
    public PageResponse<DemandListResponse> listByUser(Integer userId, Integer status, int page, int size) {
        Page<Demand> result = demandRepository.findByUserIdAndOptionalStatus(
                userId, status, PageRequest.of(page - 1, size));
        return PageResponse.of(result, DemandListResponse::from);
    }

    @Override
    public DemandDetailResponse getDetail(Integer demandId, Integer userId) {
        Demand demand = findDemandOrThrow(demandId);
        if (!demand.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.DEMAND_NO_PERMISSION);
        }
        return buildDetail(demand);
    }

    @Override
    @Transactional
    public void cancel(Integer demandId, Integer userId) {
        Demand demand = findDemandOrThrow(demandId);
        if (!demand.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.DEMAND_NO_PERMISSION);
        }
        DemandStatus currentStatus = DemandStatus.of(demand.getStatus());
        if (currentStatus.isTerminal()) {
            throw new BusinessException(ErrorCode.DEMAND_STATUS_INVALID,
                    "需求已" + currentStatus.getLabel() + "，无法取消");
        }

        int oldStatus = demand.getStatus();
        demand.setStatus(DemandStatus.CANCELLED.getValue());
        demandRepository.save(demand);

        createFollowUp(demandId, userId, FollowUpAction.STATUS_CHANGE,
                "用户取消需求", oldStatus, DemandStatus.CANCELLED.getValue());

        publishStatusChanged(demand, oldStatus, DemandStatus.CANCELLED.getValue());
        log.info("用户 {} 取消了需求 {}", userId, demandId);
    }

    // ==================== 后台管理 ====================

    @Override
    public PageResponse<DemandListResponse> adminSearch(Integer status, String demandType,
                                                         String keyword, int page, int size) {
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        String dt = (demandType != null && !demandType.isBlank()) ? demandType : null;
        Page<Demand> result = demandRepository.adminSearch(status, dt, kw, PageRequest.of(page - 1, size));
        return PageResponse.of(result, DemandListResponse::from);
    }

    @Override
    public DemandDetailResponse adminGetDetail(Integer demandId) {
        return buildDetail(findDemandOrThrow(demandId));
    }

    @Override
    @Transactional
    public void changeStatus(Integer demandId, Integer newStatus, String content, Integer operatorId) {
        Demand demand = findDemandOrThrow(demandId);
        DemandStatus currentStatus = DemandStatus.of(demand.getStatus());
        DemandStatus targetStatus = DemandStatus.of(newStatus);

        if (currentStatus.isTerminal()) {
            throw new BusinessException(ErrorCode.DEMAND_STATUS_INVALID,
                    "需求已" + currentStatus.getLabel() + "，不可变更状态");
        }

        int oldStatus = demand.getStatus();
        demand.setStatus(newStatus);
        demandRepository.save(demand);

        String note = content != null ? content : "状态从「" + currentStatus.getLabel() + "」变更为「" + targetStatus.getLabel() + "」";
        createFollowUp(demandId, operatorId, FollowUpAction.STATUS_CHANGE,
                note, oldStatus, newStatus);

        publishStatusChanged(demand, oldStatus, newStatus);
        log.info("管理员 {} 将需求 {} 状态从 {} 变更为 {}", operatorId, demandId,
                currentStatus.getLabel(), targetStatus.getLabel());
    }

    @Override
    @Transactional
    public void addFollowUp(Integer demandId, String action, String content, Integer operatorId) {
        findDemandOrThrow(demandId);
        FollowUpAction followUpAction;
        try {
            followUpAction = FollowUpAction.valueOf(action);
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "无效的跟进操作类型: " + action);
        }
        createFollowUp(demandId, operatorId, followUpAction, content, null, null);
        log.info("管理员 {} 为需求 {} 添加了 {} 跟进记录", operatorId, demandId, followUpAction.getLabel());
    }

    // ==================== 内部方法 ====================

    private Demand findDemandOrThrow(Integer demandId) {
        return demandRepository.findById(demandId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DEMAND_NOT_FOUND));
    }

    private void createFollowUp(Integer demandId, Integer operatorId, FollowUpAction action,
                                 String content, Integer oldStatus, Integer newStatus) {
        DemandFollowUp followUp = new DemandFollowUp();
        followUp.setDemandId(demandId);
        followUp.setOperatorId(operatorId);
        followUp.setAction(action.name());
        followUp.setContent(content);
        followUp.setOldStatus(oldStatus);
        followUp.setNewStatus(newStatus);
        followUpRepository.save(followUp);
    }

    private DemandDetailResponse buildDetail(Demand demand) {
        DemandDetailResponse detail = DemandDetailResponse.from(demand);
        List<DemandFollowUp> followUps = followUpRepository.findByDemandIdOrderByCreatedAtDesc(demand.getId());
        detail.setFollowUps(followUps.stream().map(DemandFollowUpResponse::from).toList());
        return detail;
    }

    private void publishStatusChanged(Demand demand, int oldStatus, int newStatus) {
        String title = demand.getTitle();
        if (title == null || title.isBlank()) {
            title = demand.getTrainingTopic();
        }
        eventPublisher.publish(new DemandStatusChangedEvent(
                demand.getId(), title, demand.getUserId(), oldStatus, newStatus));
    }
}
