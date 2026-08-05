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
import com.taoke.course.entity.interaction.TrainerLeadMessage;
import com.taoke.course.enums.DemandCourseKind;
import com.taoke.course.enums.DemandStatus;
import com.taoke.course.enums.DemandType;
import com.taoke.course.enums.FollowUpAction;
import com.taoke.course.repository.demand.DemandFollowUpRepository;
import com.taoke.course.repository.demand.DemandRepository;
import com.taoke.course.repository.interaction.TrainerLeadMessageRepository;
import com.taoke.user.api.EnterpriseBuyerService;
import com.taoke.user.captcha.CaptchaProperties;
import com.taoke.user.captcha.CaptchaTokenStore;
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
    private final TrainerLeadMessageRepository trainerLeadMessageRepository;
    private final EnterpriseBuyerService enterpriseBuyerService;
    private final EventPublisher eventPublisher;
    private final CaptchaTokenStore captchaTokenStore;
    private final CaptchaProperties captchaProperties;

    // ==================== C 端操作 ====================

    @Override
    @Transactional
    public DemandDetailResponse create(Integer userId, CreateDemandRequest req) {
        return doCreate(userId, req, "提交需求");
    }

    @Override
    @Transactional
    public DemandDetailResponse createPublic(CreateDemandRequest req) {
        validatePublicCaptcha(req);
        return doCreate(null, req, "游客提交需求");
    }

    private void validatePublicCaptcha(CreateDemandRequest req) {
        if (!DemandCourseKind.OPEN.name().equals(req.getCourseKind())) {
            return;
        }
        if (!captchaProperties.isEnabled()) {
            return;
        }
        if (!captchaTokenStore.consume(req.getCaptchaToken())) {
            throw new BusinessException(ErrorCode.CAPTCHA_REQUIRED);
        }
    }

    @Override
    @Transactional
    public DemandDetailResponse createFromTrainerMessage(Integer messageId, Integer operatorId) {
        TrainerLeadMessage message = trainerLeadMessageRepository.findById(messageId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "留言不存在"));
        if (message.getStatus() != null && message.getStatus() >= 1) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "该留言已转为需求或已分配");
        }

        CreateDemandRequest req = new CreateDemandRequest();
        req.setDemandType(DemandType.TRAINING.name());
        req.setTitle(message.getTrainingTopic());
        req.setTrainingTopic(message.getTrainingTopic());
        req.setDescription(buildMessageDescription(message));
        req.setContactName(message.getContactName());
        req.setContactPhone(message.getContactMobile());
        req.setProvinceId(message.getProvinceId());
        req.setCityId(message.getCityId());
        req.setDistrictId(message.getDistrictId());

        DemandDetailResponse detail = doCreate(message.getUserId(), req, "由专家留言 #" + messageId + " 转为需求");
        createFollowUp(detail.getId(), operatorId, FollowUpAction.ASSIGN_CS,
                "由留言 #" + messageId + " 转为培训需求", null, DemandStatus.SUBMITTED.getValue());

        message.setStatus(1);
        trainerLeadMessageRepository.save(message);
        log.info("管理员 {} 将留言 {} 转为需求 {}", operatorId, messageId, detail.getId());
        return detail;
    }

    private DemandDetailResponse doCreate(Integer userId, CreateDemandRequest req, String followUpNote) {
        // 校验需求类型
        DemandType demandType;
        try {
            demandType = DemandType.valueOf(req.getDemandType());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "无效的需求类型: " + req.getDemandType());
        }

        // 查询企业采购方信息（登录用户且已有企业档案时关联）
        Integer enterpriseId = null;
        if (userId != null) {
            try {
                EnterpriseBuyerResponse buyer = enterpriseBuyerService.getByUserId(userId);
                if (buyer != null) {
                    enterpriseId = buyer.getId();
                }
            } catch (Exception ignored) {
                // 非企业采购者，enterpriseId 为空
            }
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
        demand.setCompanyName(req.getCompanyName());
        demand.setContactEmail(req.getContactEmail());
        demand.setCompanyTel(req.getCompanyTel());
        demand.setExpertiseCategoryId(req.getExpertiseCategoryId());
        demand.setExpectedProposalCount(req.getExpectedProposalCount());
        demand.setSourceTrainerId(req.getSourceTrainerId());
        demand.setCourseKind(req.getCourseKind());
        demand.setProvinceId(req.getProvinceId());
        demand.setCityId(req.getCityId());
        demand.setDistrictId(req.getDistrictId());
        demand.setStatus(DemandStatus.SUBMITTED.getValue());
        // demand_no 列 NOT NULL：先占位 flush 拿 id，再回填正式单号
        demand.setDemandNo("XQ-TMP-" + System.nanoTime());
        demandRepository.saveAndFlush(demand);
        demand.setDemandNo(String.format("XQ%08d", demand.getId()));
        demandRepository.save(demand);

        // 写入初始跟进记录
        createFollowUp(demand.getId(), userId, FollowUpAction.STATUS_CHANGE,
                followUpNote, null, DemandStatus.SUBMITTED.getValue());

        log.info("需求已提交, demandId={}, demandNo={}, userId={}", demand.getId(), demand.getDemandNo(), userId);
        return buildDetail(demand);
    }

    private String buildMessageDescription(TrainerLeadMessage message) {
        StringBuilder sb = new StringBuilder();
        if (message.getTrainingGoal() != null && !message.getTrainingGoal().isBlank()) {
            sb.append("培训目标：").append(message.getTrainingGoal()).append('\n');
        }
        if (message.getCompanyName() != null && !message.getCompanyName().isBlank()) {
            sb.append("公司：").append(message.getCompanyName()).append('\n');
        }
        if (message.getTrainingDays() != null && !message.getTrainingDays().isBlank()) {
            sb.append("培训天数：").append(message.getTrainingDays()).append('\n');
        }
        if (message.getRemark() != null && !message.getRemark().isBlank()) {
            sb.append("备注：").append(message.getRemark());
        }
        return sb.toString().trim();
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
        if (demand.getUserId() == null || !demand.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.DEMAND_NO_PERMISSION);
        }
        return buildDetail(demand);
    }

    @Override
    @Transactional
    public DemandDetailResponse update(Integer demandId, Integer userId, CreateDemandRequest req) {
        Demand demand = findDemandOrThrow(demandId);
        if (demand.getUserId() == null || !demand.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.DEMAND_NO_PERMISSION);
        }
        DemandStatus currentStatus = DemandStatus.of(demand.getStatus());
        if (currentStatus.isTerminal()) {
            throw new BusinessException(ErrorCode.DEMAND_STATUS_INVALID,
                    "需求已" + currentStatus.getLabel() + "，无法修改");
        }

        applyEditableFields(demand, req);
        demandRepository.save(demand);
        createFollowUp(demandId, userId, FollowUpAction.STATUS_CHANGE,
                "用户修改需求内容", demand.getStatus(), demand.getStatus());

        log.info("用户 {} 修改了需求 {}", userId, demandId);
        return buildDetail(demand);
    }

    @Override
    @Transactional
    public void cancel(Integer demandId, Integer userId) {
        Demand demand = findDemandOrThrow(demandId);
        if (demand.getUserId() == null || !demand.getUserId().equals(userId)) {
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

    private void applyEditableFields(Demand demand, CreateDemandRequest req) {
        demand.setDemandType(req.getDemandType());
        demand.setTitle(req.getTitle());
        demand.setTrainingTopic(req.getTrainingTopic());
        demand.setTraineeCount(req.getTraineeCount());
        demand.setBudgetMin(req.getBudgetMin());
        demand.setBudgetMax(req.getBudgetMax());
        demand.setExpectedStartDate(req.getExpectedStartDate());
        demand.setFormat(req.getFormat());
        demand.setDescription(req.getDescription());
        demand.setSourceCaseId(req.getSourceCaseId());
        demand.setSourceCourseId(req.getSourceCourseId());
        demand.setContactName(req.getContactName());
        demand.setContactPhone(req.getContactPhone());
        demand.setProvinceId(req.getProvinceId());
        demand.setCityId(req.getCityId());
        demand.setDistrictId(req.getDistrictId());
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
    public long countByStatus(Integer status) {
        return demandRepository.countByStatus(status);
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
