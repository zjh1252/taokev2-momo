package com.taoke.user.service;

import com.taoke.common.dto.PageResult;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.AlliancePartnerApplicationService;
import com.taoke.user.dto.alliance.AlliancePartnerApplyRequest;
import com.taoke.user.dto.alliance.AlliancePartnerApplicationResponse;
import com.taoke.user.entity.AlliancePartnerApplication;
import com.taoke.user.repository.AlliancePartnerApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 培训合伙人申请服务实现。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlliancePartnerApplicationServiceImpl
        implements AlliancePartnerApplicationService {

    private static final int STATUS_PENDING = 1;
    private static final int STATUS_APPROVED = 2;
    private static final int STATUS_REJECTED = 3;
    private static final String DEFAULT_AGREEMENT_VERSION = "v1";
    private static final DateTimeFormatter PARTNER_CODE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final AlliancePartnerApplicationRepository repository;
    private final AlliancePartnerNotificationSender notificationSender;

    @Override
    public AlliancePartnerApplicationResponse getLatestByUserId(Integer userId) {
        return repository.findFirstByUserIdOrderByIdDesc(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    public AlliancePartnerApplicationResponse submit(
            Integer userId, AlliancePartnerApplyRequest request) {
        if (request == null || !Boolean.TRUE.equals(request.getAgreementSigned())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请先勾选并同意协议");
        }
        if (repository.findFirstByUserIdAndStatusOrderByIdDesc(userId, STATUS_PENDING)
                .isPresent()) {
            throw new BusinessException(
                    ErrorCode.PARAM_INVALID, "您已有待审核的培训合伙人申请");
        }
        if (repository.findFirstByUserIdAndStatusOrderByIdDesc(userId, STATUS_APPROVED)
                .isPresent()) {
            throw new BusinessException(
                    ErrorCode.PARAM_INVALID, "您已是培训合伙人，请勿重复申请");
        }
        if (repository.findFirstByUserIdAndStatusOrderByIdDesc(userId, STATUS_PENDING)
                .isPresent()) {
            throw new BusinessException(
                    ErrorCode.PARAM_INVALID, "您已有待审核的培训合伙人申请");
        }

        AlliancePartnerApplication application = new AlliancePartnerApplication();
        application.setUserId(userId);
        application.setPartnerCode(generatePartnerCode(userId));
        application.setContactName(request.getContactName());
        application.setCompanyName(request.getCompanyName());
        application.setCompanyPhone(request.getCompanyPhone());
        application.setCompanyEmail(request.getCompanyEmail());
        application.setProvinceId(request.getProvinceId());
        application.setCityId(request.getCityId());
        application.setLegalPerson(request.getLegalPerson());
        application.setLegalIdCard(request.getLegalIdCard());
        application.setContactQq(request.getContactQq());
        application.setAgreementVersion(
                request.getAgreementVersion() == null || request.getAgreementVersion().isBlank()
                        ? DEFAULT_AGREEMENT_VERSION
                        : request.getAgreementVersion());
        application.setStatus(STATUS_PENDING);
        return toResponse(repository.save(application));
    }

    @Override
    public PageResult<AlliancePartnerApplicationResponse> pageForAdmin(
            Integer status, int page, int size) {
        int pageNumber = Math.max(page, 1);
        Pageable pageable = PageRequest.of(
                pageNumber - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<AlliancePartnerApplication> result = status == null
                ? repository.findAll(pageable)
                : repository.findByStatus(status, pageable);
        return PageResult.of(
                result.getTotalElements(),
                pageNumber,
                size,
                result.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    public AlliancePartnerApplicationResponse getById(Integer id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional
    public void approve(Integer id, Integer reviewerUserId) {
        AlliancePartnerApplication application = findById(id);
        LocalDateTime reviewedAt = LocalDateTime.now();
        if (repository.approveIfPending(id, reviewedAt, reviewerUserId) == 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "当前状态不可审核");
        }
        sendReviewNotificationAfterCommit(
                application.getId(), application.getUserId(), "APPLY_PASSED", "");
    }

    @Override
    @Transactional
    public void reject(Integer id, Integer reviewerUserId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "驳回原因不能为空");
        }
        AlliancePartnerApplication application = findById(id);
        LocalDateTime reviewedAt = LocalDateTime.now();
        if (repository.rejectIfPending(id, reason, reviewedAt, reviewerUserId) == 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "当前状态不可审核");
        }
        sendReviewNotificationAfterCommit(
                application.getId(), application.getUserId(), "APPLY_REJECTED", reason);
    }

    private AlliancePartnerApplication findById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.NOT_FOUND, "未找到培训合伙人申请"));
    }

    private String generatePartnerCode(Integer userId) {
        return "TPC_"
                + PARTNER_CODE_TIME_FORMATTER.format(LocalDateTime.now())
                + String.format("%06d", userId);
    }

    private void sendReviewNotificationAfterCommit(
            Integer applicationId, Integer userId, String templateCode, String reason) {
        Runnable notification = () -> sendReviewNotificationSafely(
                applicationId, userId, templateCode, reason);
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            notification.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        notification.run();
                    }
                });
    }

    private void sendReviewNotificationSafely(
            Integer applicationId, Integer userId, String templateCode, String reason) {
        try {
            notificationSender.sendReviewResult(
                    applicationId, userId, templateCode, reason);
        } catch (Exception exception) {
            log.warn(
                    "发送培训合伙人申请审核通知失败，applicationId={}",
                    applicationId,
                    exception);
        }
    }

    private AlliancePartnerApplicationResponse toResponse(
            AlliancePartnerApplication application) {
        AlliancePartnerApplicationResponse response =
                new AlliancePartnerApplicationResponse();
        response.setId(application.getId());
        response.setUserId(application.getUserId());
        response.setPartnerCode(application.getPartnerCode());
        response.setContactName(application.getContactName());
        response.setCompanyName(application.getCompanyName());
        response.setCompanyPhone(application.getCompanyPhone());
        response.setCompanyEmail(application.getCompanyEmail());
        response.setProvinceId(application.getProvinceId());
        response.setCityId(application.getCityId());
        response.setLegalPerson(application.getLegalPerson());
        response.setLegalIdCard(application.getLegalIdCard());
        response.setContactQq(application.getContactQq());
        response.setAgreementVersion(application.getAgreementVersion());
        response.setStatus(application.getStatus());
        response.setRejectReason(application.getRejectReason());
        response.setReviewedAt(application.getReviewedAt());
        response.setReviewedBy(application.getReviewedBy());
        response.setCreatedAt(application.getCreatedAt());
        response.setUpdatedAt(application.getUpdatedAt());
        return response;
    }
}
