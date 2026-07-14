package com.taoke.user.service;

import com.taoke.common.dto.PageResult;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.AllianceAmbassadorApplicationService;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplyRequest;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplicationResponse;
import com.taoke.user.entity.AllianceAmbassadorApplication;
import com.taoke.user.repository.AllianceAmbassadorApplicationRepository;
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
 * 推广大使申请服务实现。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AllianceAmbassadorApplicationServiceImpl
        implements AllianceAmbassadorApplicationService {

    private static final int STATUS_PENDING = 1;
    private static final int STATUS_APPROVED = 2;
    private static final int STATUS_REJECTED = 3;
    private static final String DEFAULT_AGREEMENT_VERSION = "v1";
    private static final DateTimeFormatter CODE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final AllianceAmbassadorApplicationRepository repository;
    private final AllianceAmbassadorNotificationSender notificationSender;

    @Override
    public AllianceAmbassadorApplicationResponse getLatestByUserId(Integer userId) {
        return repository.findFirstByUserIdOrderByIdDesc(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    public AllianceAmbassadorApplicationResponse submit(
            Integer userId, AllianceAmbassadorApplyRequest request) {
        if (request == null || !Boolean.TRUE.equals(request.getAgreementSigned())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请先勾选并同意协议");
        }
        if (repository.findFirstByUserIdAndStatusOrderByIdDesc(userId, STATUS_PENDING)
                .isPresent()) {
            throw new BusinessException(
                    ErrorCode.PARAM_INVALID, "您已有待审核的推广大使申请");
        }
        if (repository.findFirstByUserIdAndStatusOrderByIdDesc(userId, STATUS_APPROVED)
                .isPresent()) {
            throw new BusinessException(
                    ErrorCode.PARAM_INVALID, "您已是推广大使，请勿重复申请");
        }

        AllianceAmbassadorApplication application = new AllianceAmbassadorApplication();
        application.setUserId(userId);
        application.setAmbassadorCode(generateAmbassadorCode(userId));
        application.setAgreementVersion(
                request.getAgreementVersion() == null || request.getAgreementVersion().isBlank()
                        ? DEFAULT_AGREEMENT_VERSION
                        : request.getAgreementVersion());
        application.setStatus(STATUS_PENDING);
        return toResponse(repository.save(application));
    }

    @Override
    public PageResult<AllianceAmbassadorApplicationResponse> pageForAdmin(
            Integer status, int page, int size) {
        int pageNumber = Math.max(page, 1);
        Pageable pageable = PageRequest.of(
                pageNumber - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<AllianceAmbassadorApplication> result = status == null
                ? repository.findAll(pageable)
                : repository.findByStatus(status, pageable);
        return PageResult.of(
                result.getTotalElements(),
                pageNumber,
                size,
                result.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    public AllianceAmbassadorApplicationResponse getById(Integer id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional
    public void approve(Integer id, Integer reviewerUserId) {
        AllianceAmbassadorApplication application = findById(id);
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
        AllianceAmbassadorApplication application = findById(id);
        LocalDateTime reviewedAt = LocalDateTime.now();
        if (repository.rejectIfPending(id, reason, reviewedAt, reviewerUserId) == 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "当前状态不可审核");
        }
        sendReviewNotificationAfterCommit(
                application.getId(), application.getUserId(), "APPLY_REJECTED", reason);
    }

    private AllianceAmbassadorApplication findById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.NOT_FOUND, "未找到推广大使申请"));
    }

    private String generateAmbassadorCode(Integer userId) {
        return "AMB_"
                + CODE_TIME_FORMATTER.format(LocalDateTime.now())
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
                    "发送推广大使申请审核通知失败，applicationId={}",
                    applicationId,
                    exception);
        }
    }

    private AllianceAmbassadorApplicationResponse toResponse(
            AllianceAmbassadorApplication application) {
        AllianceAmbassadorApplicationResponse response =
                new AllianceAmbassadorApplicationResponse();
        response.setId(application.getId());
        response.setUserId(application.getUserId());
        response.setAmbassadorCode(application.getAmbassadorCode());
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
