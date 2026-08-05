package com.taoke.user.service;

import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.AllianceLecturer721ApplicationService;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplyRequest;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplicationResponse;
import com.taoke.user.entity.AllianceLecturer721Application;
import com.taoke.user.entity.UserRole;
import com.taoke.user.repository.AllianceLecturer721ApplicationRepository;
import com.taoke.user.repository.UserRoleRepository;
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
 * 721 讲师合作申请服务实现。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AllianceLecturer721ApplicationServiceImpl
        implements AllianceLecturer721ApplicationService {

    private static final int STATUS_PENDING = 1;
    private static final int STATUS_APPROVED = 2;
    private static final int ROLE_STATUS_ACTIVE = 1;
    private static final String DEFAULT_AGREEMENT_VERSION = "v1";
    private static final DateTimeFormatter CODE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final AllianceLecturer721ApplicationRepository repository;
    private final UserRoleRepository userRoleRepository;
    private final AllianceLecturer721NotificationSender notificationSender;

    @Override
    public AllianceLecturer721ApplicationResponse getLatestByUserId(Integer userId) {
        return repository.findFirstByUserIdOrderByIdDesc(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    public AllianceLecturer721ApplicationResponse submit(
            Integer userId, AllianceLecturer721ApplyRequest request) {
        if (request == null || !Boolean.TRUE.equals(request.getAgreementSigned())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请先勾选并同意协议");
        }
        requireActiveTrainer(userId);
        if (repository.findFirstByUserIdAndStatusOrderByIdDesc(userId, STATUS_PENDING)
                .isPresent()) {
            throw new BusinessException(
                    ErrorCode.PARAM_INVALID, "您已有待审核的721讲师合作申请");
        }
        if (repository.findFirstByUserIdAndStatusOrderByIdDesc(userId, STATUS_APPROVED)
                .isPresent()) {
            throw new BusinessException(
                    ErrorCode.PARAM_INVALID, "您已通过721讲师合作申请，请勿重复申请");
        }

        AllianceLecturer721Application application = new AllianceLecturer721Application();
        application.setUserId(userId);
        application.setApplicationCode(generateApplicationCode(userId));
        application.setLecturerName(request.getLecturerName());
        application.setIdCardNo(request.getIdCardNo());
        application.setCoopYears(request.getCoopYears());
        application.setDailyFee(request.getDailyFee());
        application.setAddress(request.getAddress());
        application.setPhone(request.getPhone());
        application.setWechat(request.getWechat());
        application.setEmail(request.getEmail());
        application.setBankName(request.getBankName());
        application.setBankAccount(request.getBankAccount());
        application.setSignatureUrl(request.getSignatureUrl());
        application.setAgreementVersion(
                request.getAgreementVersion() == null || request.getAgreementVersion().isBlank()
                        ? DEFAULT_AGREEMENT_VERSION
                        : request.getAgreementVersion());
        application.setStatus(STATUS_PENDING);
        return toResponse(repository.save(application));
    }

    @Override
    public PageResult<AllianceLecturer721ApplicationResponse> pageForAdmin(
            Integer status, int page, int size) {
        int pageNumber = Math.max(page, 1);
        Pageable pageable = PageRequest.of(
                pageNumber - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<AllianceLecturer721Application> result = status == null
                ? repository.findAll(pageable)
                : repository.findByStatus(status, pageable);
        return PageResult.of(
                result.getTotalElements(),
                pageNumber,
                size,
                result.getContent().stream().map(this::toResponse).toList());
    }

    @Override
    public AllianceLecturer721ApplicationResponse getById(Integer id) {
        return toResponse(findById(id));
    }

    @Override
    @Transactional
    public void approve(Integer id, Integer reviewerUserId) {
        AllianceLecturer721Application application = findById(id);
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
        AllianceLecturer721Application application = findById(id);
        LocalDateTime reviewedAt = LocalDateTime.now();
        if (repository.rejectIfPending(id, reason, reviewedAt, reviewerUserId) == 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "当前状态不可审核");
        }
        sendReviewNotificationAfterCommit(
                application.getId(), application.getUserId(), "APPLY_REJECTED", reason);
    }

    private void requireActiveTrainer(Integer userId) {
        UserRole userRole = userRoleRepository
                .findByUserIdAndRole(userId, BusinessRole.Code.TRAINER)
                .orElse(null);
        if (userRole == null || !Integer.valueOf(ROLE_STATUS_ACTIVE).equals(userRole.getStatus())) {
            throw new BusinessException(
                    ErrorCode.PARAM_INVALID, "仅已通过的专家可申请721讲师合作");
        }
    }

    private AllianceLecturer721Application findById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.NOT_FOUND, "未找到721讲师合作申请"));
    }

    private String generateApplicationCode(Integer userId) {
        return "L721_"
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
                    "发送721讲师合作申请审核通知失败，applicationId={}",
                    applicationId,
                    exception);
        }
    }

    private AllianceLecturer721ApplicationResponse toResponse(
            AllianceLecturer721Application application) {
        AllianceLecturer721ApplicationResponse response =
                new AllianceLecturer721ApplicationResponse();
        response.setId(application.getId());
        response.setUserId(application.getUserId());
        response.setApplicationCode(application.getApplicationCode());
        response.setLecturerName(application.getLecturerName());
        response.setIdCardNo(application.getIdCardNo());
        response.setCoopYears(application.getCoopYears());
        response.setDailyFee(application.getDailyFee());
        response.setAddress(application.getAddress());
        response.setPhone(application.getPhone());
        response.setWechat(application.getWechat());
        response.setEmail(application.getEmail());
        response.setBankName(application.getBankName());
        response.setBankAccount(application.getBankAccount());
        response.setSignatureUrl(application.getSignatureUrl());
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
