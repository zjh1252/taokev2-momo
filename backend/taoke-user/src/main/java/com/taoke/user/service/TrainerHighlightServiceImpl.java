package com.taoke.user.service;

import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.user.TrainerHighlightApprovedEvent;
import com.taoke.common.events.user.TrainerHighlightRejectedEvent;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.TrainerHighlightService;
import com.taoke.user.dto.trainerhighlight.SaveTrainerHighlightRequest;
import com.taoke.user.dto.trainerhighlight.TrainerHighlightResponse;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerHighlight;
import com.taoke.user.repository.TrainerHighlightRepository;
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
 * 专家精彩瞬间服务实现
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Service
@RequiredArgsConstructor
public class TrainerHighlightServiceImpl implements TrainerHighlightService {

    private final TrainerHighlightRepository highlightRepository;
    private final TrainerRepository trainerRepository;
    private final EventPublisher eventPublisher;

    // ==================== 专家自服务 ====================

    @Override
    public List<TrainerHighlightResponse> listMyHighlights(Integer userId) {
        Trainer trainer = getTrainerByUserId(userId);
        return highlightRepository.findByTrainerIdOrderBySortOrderDesc(trainer.getId())
                .stream().map(TrainerHighlightResponse::from).toList();
    }

    @Override
    @Transactional
    public TrainerHighlightResponse createHighlight(Integer userId, SaveTrainerHighlightRequest request) {
        Trainer trainer = getTrainerByUserId(userId);
        TrainerHighlight entity = new TrainerHighlight();
        entity.setTrainerId(trainer.getId());
        applyRequest(entity, request);
        entity.setStatus(0);
        entity.setRejectReason("");
        entity.setViewCount(0);
        entity = highlightRepository.save(entity);
        return TrainerHighlightResponse.from(entity);
    }

    @Override
    @Transactional
    public TrainerHighlightResponse updateHighlight(Integer userId, Integer highlightId,
                                                    SaveTrainerHighlightRequest request) {
        Trainer trainer = getTrainerByUserId(userId);
        TrainerHighlight entity = getAndCheckOwner(highlightId, trainer.getId());
        applyRequest(entity, request);
        entity.setStatus(0);
        entity.setRejectReason("");
        entity.setReviewerId(null);
        entity.setReviewedAt(null);
        entity = highlightRepository.save(entity);
        return TrainerHighlightResponse.from(entity);
    }

    @Override
    @Transactional
    public void deleteHighlight(Integer userId, Integer highlightId) {
        Trainer trainer = getTrainerByUserId(userId);
        getAndCheckOwner(highlightId, trainer.getId());
        highlightRepository.deleteById(highlightId);
    }

    @Override
    @Transactional
    public void batchSort(Integer userId, List<Integer> ids) {
        Trainer trainer = getTrainerByUserId(userId);
        int order = ids.size();
        for (Integer id : ids) {
            TrainerHighlight entity = getAndCheckOwner(id, trainer.getId());
            entity.setSortOrder(order--);
            highlightRepository.save(entity);
        }
    }

    // ==================== C端公开 ====================

    @Override
    public List<TrainerHighlightResponse> listApprovedHighlights(Integer trainerId) {
        return highlightRepository.findByTrainerIdAndStatusOrderBySortOrderDesc(trainerId, 1)
                .stream().map(TrainerHighlightResponse::from).toList();
    }

    // ==================== 后台管理 ====================

    @Override
    public TrainerHighlightResponse adminGetDetail(Integer highlightId) {
        TrainerHighlight entity = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_HIGHLIGHT_NOT_FOUND));
        return TrainerHighlightResponse.from(entity);
    }

    @Override
    public Page<TrainerHighlight> adminSearch(Integer trainerId, Integer status, int page, int size) {
        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        return highlightRepository.adminSearch(trainerId, status, pageable);
    }

    @Override
    @Transactional
    public void approve(Integer highlightId, Integer reviewerUserId) {
        TrainerHighlight entity = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_HIGHLIGHT_NOT_FOUND));
        if (entity.getStatus() != 0) {
            throw new BusinessException(ErrorCode.TRAINER_HIGHLIGHT_STATUS_INVALID, "只能审核待审核状态的精彩瞬间");
        }
        entity.setStatus(1);
        entity.setReviewerId(reviewerUserId);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setRejectReason("");
        highlightRepository.save(entity);

        Trainer trainer = trainerRepository.findById(entity.getTrainerId()).orElse(null);
        if (trainer != null) {
            eventPublisher.publish(new TrainerHighlightApprovedEvent(
                    highlightId, entity.getTitle(), trainer.getUserId()));
        }
    }

    @Override
    @Transactional
    public void reject(Integer highlightId, Integer reviewerUserId, String reason) {
        TrainerHighlight entity = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_HIGHLIGHT_NOT_FOUND));
        if (entity.getStatus() != 0) {
            throw new BusinessException(ErrorCode.TRAINER_HIGHLIGHT_STATUS_INVALID, "只能审核待审核状态的精彩瞬间");
        }
        entity.setStatus(2);
        entity.setReviewerId(reviewerUserId);
        entity.setReviewedAt(LocalDateTime.now());
        entity.setRejectReason(reason != null ? reason : "");
        highlightRepository.save(entity);

        Trainer trainer = trainerRepository.findById(entity.getTrainerId()).orElse(null);
        if (trainer != null) {
            eventPublisher.publish(new TrainerHighlightRejectedEvent(
                    highlightId, entity.getTitle(), trainer.getUserId(), reason));
        }
    }

    // ==================== 内部方法 ====================

    private Trainer getTrainerByUserId(Integer userId) {
        return trainerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_PROFILE_REQUIRED));
    }

    private TrainerHighlight getAndCheckOwner(Integer highlightId, Integer trainerId) {
        TrainerHighlight entity = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRAINER_HIGHLIGHT_NOT_FOUND));
        if (!entity.getTrainerId().equals(trainerId)) {
            throw new BusinessException(ErrorCode.TRAINER_HIGHLIGHT_NO_PERMISSION);
        }
        return entity;
    }

    private void applyRequest(TrainerHighlight entity, SaveTrainerHighlightRequest req) {
        entity.setMediaType(req.getMediaType());
        entity.setTitle(req.getTitle() != null ? req.getTitle() : "");
        entity.setDescription(req.getDescription() != null ? req.getDescription() : "");
        entity.setMediaUrl(req.getMediaUrl());
        entity.setThumbnailUrl(req.getThumbnailUrl() != null ? req.getThumbnailUrl() : "");
        entity.setDuration(req.getDuration() != null ? req.getDuration() : 0);
        entity.setFileSize(req.getFileSize() != null ? req.getFileSize() : 0L);
        entity.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
    }
}
