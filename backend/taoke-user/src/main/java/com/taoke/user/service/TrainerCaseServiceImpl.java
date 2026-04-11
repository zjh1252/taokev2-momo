package com.taoke.user.service;

import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.user.TrainerCaseApprovedEvent;
import com.taoke.common.events.user.TrainerCaseRejectedEvent;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.dto.trainercase.*;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerCase;
import com.taoke.user.entity.TrainerCaseFile;
import com.taoke.user.repository.TrainerCaseFileRepository;
import com.taoke.user.repository.TrainerCaseRepository;
import com.taoke.user.repository.TrainerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 专家授课案例服务实现
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:00
 */
@Service
@RequiredArgsConstructor
public class TrainerCaseServiceImpl implements TrainerCaseService {

    private final TrainerCaseRepository caseRepository;
    private final TrainerCaseFileRepository caseFileRepository;
    private final TrainerRepository trainerRepository;
    private final EventPublisher eventPublisher;

    // ==================== 专家自服务 ====================

    @Override
    public List<TrainerCaseResponse> listMyCases(Integer userId) {
        Trainer trainer = getTrainerByUserId(userId);
        List<TrainerCase> cases = caseRepository.findByTrainerIdOrderBySortOrderDesc(trainer.getId());
        return cases.stream().map(c -> {
            TrainerCaseResponse r = TrainerCaseResponse.from(c);
            r.setFiles(getFileResponses(c.getId()));
            return r;
        }).toList();
    }

    @Override
    public TrainerCaseResponse getMyCaseDetail(Integer userId, Integer caseId) {
        Trainer trainer = getTrainerByUserId(userId);
        TrainerCase entity = getCaseAndCheckOwner(caseId, trainer.getId());
        TrainerCaseResponse r = TrainerCaseResponse.from(entity);
        r.setFiles(getFileResponses(entity.getId()));
        return r;
    }

    @Override
    @Transactional
    public TrainerCaseResponse createCase(Integer userId, SaveTrainerCaseRequest request) {
        Trainer trainer = getTrainerByUserId(userId);
        TrainerCase entity = new TrainerCase();
        entity.setTrainerId(trainer.getId());
        applyRequest(entity, request);
        entity.setAutoExtracted(false);
        entity.setStatus(0);
        entity.setRejectReason("");
        entity = caseRepository.save(entity);
        TrainerCaseResponse r = TrainerCaseResponse.from(entity);
        r.setFiles(List.of());
        return r;
    }

    @Override
    @Transactional
    public TrainerCaseResponse updateCase(Integer userId, Integer caseId, SaveTrainerCaseRequest request) {
        Trainer trainer = getTrainerByUserId(userId);
        TrainerCase entity = getCaseAndCheckOwner(caseId, trainer.getId());
        applyRequest(entity, request);
        // 编辑后重新回到待审核状态
        entity.setStatus(0);
        entity.setRejectReason("");
        entity.setReviewerId(null);
        entity.setReviewedAt(null);
        entity = caseRepository.save(entity);
        TrainerCaseResponse r = TrainerCaseResponse.from(entity);
        r.setFiles(getFileResponses(entity.getId()));
        return r;
    }

    @Override
    @Transactional
    public void deleteCase(Integer userId, Integer caseId) {
        Trainer trainer = getTrainerByUserId(userId);
        getCaseAndCheckOwner(caseId, trainer.getId());
        caseFileRepository.deleteByCaseId(caseId);
        caseRepository.deleteById(caseId);
    }

    @Override
    @Transactional
    public TrainerCaseFileResponse addCaseFile(Integer userId, Integer caseId,
                                               SaveTrainerCaseFileRequest request) {
        Trainer trainer = getTrainerByUserId(userId);
        getCaseAndCheckOwner(caseId, trainer.getId());

        TrainerCaseFile file = new TrainerCaseFile();
        file.setTrainerId(trainer.getId());
        file.setCaseId(caseId);
        file.setFileType(request.getFileType());
        file.setTitle(request.getTitle() != null ? request.getTitle() : "");
        file.setDescription(request.getDescription() != null ? request.getDescription() : "");
        file.setFileUrl(request.getFileUrl());
        file.setThumbnailUrl(request.getThumbnailUrl() != null ? request.getThumbnailUrl() : "");
        file.setWidth(request.getWidth() != null ? request.getWidth() : 0);
        file.setHeight(request.getHeight() != null ? request.getHeight() : 0);
        file.setDuration(request.getDuration() != null ? request.getDuration() : 0);
        file.setFileSize(request.getFileSize() != null ? request.getFileSize() : 0L);
        file.setAutoExtracted(false);
        file.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        file.setStatus(0);
        file.setRejectReason("");
        file.setViewCount(0);
        file = caseFileRepository.save(file);
        return TrainerCaseFileResponse.from(file);
    }

    @Override
    @Transactional
    public void deleteCaseFile(Integer userId, Integer caseId, Integer fileId) {
        Trainer trainer = getTrainerByUserId(userId);
        getCaseAndCheckOwner(caseId, trainer.getId());
        TrainerCaseFile file = caseFileRepository.findById(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_CASE_FILE_NOT_FOUND));
        if (!file.getCaseId().equals(caseId)) {
            throw new BusinessException(ErrorCode.TRAINER_CASE_NO_PERMISSION);
        }
        caseFileRepository.deleteById(fileId);
    }

    // ==================== C端公开 ====================

    @Override
    public List<TrainerCaseResponse> listApprovedCases(Integer trainerId) {
        List<TrainerCase> cases = caseRepository.findByTrainerIdAndStatusOrderBySortOrderDesc(trainerId, 1);
        return cases.stream().map(c -> {
            TrainerCaseResponse r = TrainerCaseResponse.from(c);
            List<TrainerCaseFile> approvedFiles = caseFileRepository.findByCaseIdOrderBySortOrderAsc(c.getId())
                    .stream().filter(f -> f.getStatus() == 1).toList();
            r.setFiles(approvedFiles.stream().map(TrainerCaseFileResponse::from).toList());
            return r;
        }).toList();
    }

    // ==================== 后台管理 ====================

    @Override
    public TrainerCaseResponse adminGetDetail(Integer caseId) {
        TrainerCase entity = caseRepository.findById(caseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_CASE_NOT_FOUND));
        TrainerCaseResponse r = TrainerCaseResponse.from(entity);
        r.setFiles(getFileResponses(entity.getId()));
        return r;
    }

    @Override
    public Page<TrainerCase> adminSearch(Integer trainerId, Integer status, int page, int size) {
        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        return caseRepository.adminSearch(trainerId, status, pageable);
    }

    @Override
    @Transactional
    public void approve(Integer caseId, Integer reviewerUserId) {
        TrainerCase entity = caseRepository.findById(caseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_CASE_NOT_FOUND));
        if (entity.getStatus() != 0) {
            throw new BusinessException(ErrorCode.TRAINER_CASE_STATUS_INVALID, "只能审核待审核状态的案例");
        }
        entity.setStatus(1);
        entity.setReviewerId(reviewerUserId);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setRejectReason("");
        caseRepository.save(entity);

        Trainer trainer = trainerRepository.findById(entity.getTrainerId()).orElse(null);
        if (trainer != null) {
            eventPublisher.publish(new TrainerCaseApprovedEvent(
                    caseId, entity.getCaseTitle(), trainer.getUserId()));
        }
    }

    @Override
    @Transactional
    public void reject(Integer caseId, Integer reviewerUserId, String reason) {
        TrainerCase entity = caseRepository.findById(caseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_CASE_NOT_FOUND));
        if (entity.getStatus() != 0) {
            throw new BusinessException(ErrorCode.TRAINER_CASE_STATUS_INVALID, "只能审核待审核状态的案例");
        }
        entity.setStatus(2);
        entity.setReviewerId(reviewerUserId);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setRejectReason(reason != null ? reason : "");
        caseRepository.save(entity);

        Trainer trainer = trainerRepository.findById(entity.getTrainerId()).orElse(null);
        if (trainer != null) {
            eventPublisher.publish(new TrainerCaseRejectedEvent(
                    caseId, entity.getCaseTitle(), trainer.getUserId(), reason));
        }
    }

    // ==================== 内部方法 ====================

    private Trainer getTrainerByUserId(Integer userId) {
        return trainerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_PROFILE_REQUIRED));
    }

    private TrainerCase getCaseAndCheckOwner(Integer caseId, Integer trainerId) {
        TrainerCase entity = caseRepository.findById(caseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_CASE_NOT_FOUND));
        if (!entity.getTrainerId().equals(trainerId)) {
            throw new BusinessException(ErrorCode.TRAINER_CASE_NO_PERMISSION);
        }
        return entity;
    }

    private void applyRequest(TrainerCase entity, SaveTrainerCaseRequest req) {
        entity.setCaseTitle(req.getCaseTitle());
        entity.setEnterpriseName(req.getEnterpriseName());
        entity.setIndustry(req.getIndustry() != null ? req.getIndustry() : "");
        entity.setTrainingTopic(req.getTrainingTopic() != null ? req.getTrainingTopic() : "");
        entity.setTrainingEffect(req.getTrainingEffect());
        entity.setTraineeCount(req.getTraineeCount());
        entity.setTrainingDate(req.getTrainingDate());
        entity.setDescription(req.getDescription());
        entity.setCoverImage(req.getCoverImage() != null ? req.getCoverImage() : "");
        entity.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
    }

    private List<TrainerCaseFileResponse> getFileResponses(Integer caseId) {
        return caseFileRepository.findByCaseIdOrderBySortOrderAsc(caseId)
                .stream().map(TrainerCaseFileResponse::from).toList();
    }
}
