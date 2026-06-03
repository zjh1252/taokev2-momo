package com.taoke.user.service;

import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.user.TrainerHighlightApprovedEvent;
import com.taoke.common.events.user.TrainerHighlightRejectedEvent;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.TrainerHighlightService;
import com.taoke.user.dto.trainerhighlight.*;
import com.taoke.user.entity.TrainerHighlight;
import com.taoke.user.entity.TrainerHighlightFile;
import com.taoke.user.entity.Trainer;
import com.taoke.user.repository.TrainerHighlightFileRepository;
import com.taoke.user.repository.TrainerHighlightRepository;
import com.taoke.user.repository.TrainerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final TrainerHighlightFileRepository highlightFileRepository;
    private final TrainerRepository trainerRepository;
    private final EventPublisher eventPublisher;

    /** 审核状态：0=待审核, 1=通过, 2=驳回, 3=草稿 */
    private static final int STATUS_PENDING = 0;
    private static final int STATUS_DRAFT = 3;

    // ==================== 专家自服务 ====================

    @Override
    public List<TrainerHighlightResponse> listMyHighlights(Integer userId) {
        Trainer trainer = requireTrainer(userId);
        List<TrainerHighlight> highlights = highlightRepository
                .findByTrainerIdOrderBySortOrderAsc(trainer.getId());
        List<TrainerHighlightResponse> list = toResponsesWithFiles(highlights);
        // 填充归属专家信息，便于编辑页只读横幅展示
        for (TrainerHighlightResponse r : list) {
            r.setTrainerUserId(trainer.getUserId());
            r.setTrainerName(trainer.getName());
        }
        return list;
    }

    @Override
    @Transactional
    public TrainerHighlightResponse createHighlight(Integer userId,
                                                    SaveTrainerHighlightRequest request, boolean draft) {
        Trainer trainer = requireTrainer(userId);

        TrainerHighlight h = new TrainerHighlight();
        h.setTrainerId(trainer.getId());
        h.setTitle(request.getTitle());
        h.setDescription(request.getDescription());
        h.setCoverImage(request.getCoverImage() != null ? request.getCoverImage() : "");
        h.setMediaUrl("");
        h.setMediaType(1);
        h.setThumbnailUrl("");
        h.setDuration(0);
        h.setFileSize(0L);
        h.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        // draft=true 存为草稿(3)，否则进入待审核(0)
        h.setStatus(draft ? STATUS_DRAFT : STATUS_PENDING);
        h.setViewCount(0);
        highlightRepository.save(h);

        TrainerHighlightResponse resp = TrainerHighlightResponse.from(h);
        resp.setFiles(List.of());
        return resp;
    }

    @Override
    @Transactional
    public TrainerHighlightResponse updateHighlight(Integer userId, Integer highlightId,
                                                    SaveTrainerHighlightRequest request, boolean draft) {
        Trainer trainer = requireTrainer(userId);
        TrainerHighlight h = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "精彩瞬间不存在"));
        if (!h.getTrainerId().equals(trainer.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作他人精彩瞬间");
        }

        if (request.getTitle() != null) h.setTitle(request.getTitle());
        if (request.getDescription() != null) h.setDescription(request.getDescription());
        if (request.getCoverImage() != null) h.setCoverImage(request.getCoverImage());
        if (request.getSortOrder() != null) h.setSortOrder(request.getSortOrder());

        // 草稿保存维持草稿态；正式提交（或编辑已审核内容）重新进入待审核
        h.setStatus(draft ? STATUS_DRAFT : STATUS_PENDING);
        h.setRejectReason(null);
        highlightRepository.save(h);

        return toResponseWithFiles(h);
    }

    @Override
    @Transactional
    public void deleteHighlight(Integer userId, Integer highlightId) {
        Trainer trainer = requireTrainer(userId);
        TrainerHighlight h = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "精彩瞬间不存在"));
        if (!h.getTrainerId().equals(trainer.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作他人精彩瞬间");
        }
        highlightFileRepository.deleteByHighlightId(highlightId);
        highlightRepository.delete(h);
    }

    @Override
    @Transactional
    public void batchSort(Integer userId, List<Integer> ids) {
        Trainer trainer = requireTrainer(userId);
        for (int i = 0; i < ids.size(); i++) {
            TrainerHighlight h = highlightRepository.findById(ids.get(i)).orElse(null);
            if (h != null && h.getTrainerId().equals(trainer.getId())) {
                h.setSortOrder(i);
                highlightRepository.save(h);
            }
        }
    }

    @Override
    @Transactional
    public TrainerHighlightFileResponse addHighlightFile(Integer userId, Integer highlightId,
                                                         SaveTrainerHighlightFileRequest request) {
        Trainer trainer = requireTrainer(userId);
        TrainerHighlight h = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "精彩瞬间不存在"));
        if (!h.getTrainerId().equals(trainer.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作他人精彩瞬间");
        }

        TrainerHighlightFile file = new TrainerHighlightFile();
        file.setHighlightId(highlightId);
        file.setTrainerId(trainer.getId());
        file.setFileType(request.getFileType());
        file.setTitle(request.getTitle() != null ? request.getTitle() : "");
        file.setFileUrl(request.getFileUrl());
        file.setThumbnailUrl(request.getThumbnailUrl() != null ? request.getThumbnailUrl() : "");
        file.setWidth(request.getWidth() != null ? request.getWidth() : 0);
        file.setHeight(request.getHeight() != null ? request.getHeight() : 0);
        file.setDuration(request.getDuration() != null ? request.getDuration() : 0);
        file.setFileSize(request.getFileSize() != null ? request.getFileSize() : 0L);
        file.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        highlightFileRepository.save(file);

        return TrainerHighlightFileResponse.from(file);
    }

    @Override
    @Transactional
    public void deleteHighlightFile(Integer userId, Integer highlightId, Integer fileId) {
        Trainer trainer = requireTrainer(userId);
        TrainerHighlight h = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "精彩瞬间不存在"));
        if (!h.getTrainerId().equals(trainer.getId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作他人精彩瞬间");
        }

        TrainerHighlightFile file = highlightFileRepository.findById(fileId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "文件不存在"));
        if (!file.getHighlightId().equals(highlightId)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "文件不属于该精彩瞬间");
        }
        highlightFileRepository.delete(file);
    }

    // ==================== C端公开 ====================

    @Override
    public List<TrainerHighlightResponse> listApprovedHighlights(Integer trainerId) {
        List<TrainerHighlight> highlights = highlightRepository
                .findByTrainerIdAndStatusOrderBySortOrderAsc(trainerId, 1);
        return toResponsesWithFiles(highlights);
    }

    // ==================== 后台管理 ====================

    @Override
    public TrainerHighlightResponse adminGetDetail(Integer highlightId) {
        TrainerHighlight h = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "精彩瞬间不存在"));
        return toResponseWithFiles(h);
    }

    @Override
    public Page<TrainerHighlight> adminSearch(Integer trainerId, Integer status, int page, int size) {
        Specification<TrainerHighlight> spec = Specification.where(null);
        if (trainerId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("trainerId"), trainerId));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        } else {
            // 未指定状态时排除草稿(3)，草稿不进入后台审核列表
            spec = spec.and((root, q, cb) -> cb.notEqual(root.get("status"), STATUS_DRAFT));
        }
        return highlightRepository.findAll(spec,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")));
    }

    @Override
    @Transactional
    public void approve(Integer highlightId, Integer reviewerUserId) {
        TrainerHighlight h = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "精彩瞬间不存在"));
        h.setStatus(1);
        h.setReviewedAt(LocalDateTime.now());
        highlightRepository.save(h);

        Trainer trainer = trainerRepository.findById(h.getTrainerId()).orElse(null);
        if (trainer != null) {
            eventPublisher.publish(new TrainerHighlightApprovedEvent(
                    highlightId, h.getTitle(), trainer.getUserId()));
        }
    }

    @Override
    @Transactional
    public void reject(Integer highlightId, Integer reviewerUserId, String reason) {
        TrainerHighlight h = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "精彩瞬间不存在"));
        h.setStatus(2);
        h.setRejectReason(reason);
        h.setReviewedAt(LocalDateTime.now());
        highlightRepository.save(h);

        Trainer trainer = trainerRepository.findById(h.getTrainerId()).orElse(null);
        if (trainer != null) {
            eventPublisher.publish(new TrainerHighlightRejectedEvent(
                    highlightId, h.getTitle(), trainer.getUserId(), reason));
        }
    }

    // ==================== 内部方法 ====================

    private Trainer requireTrainer(Integer userId) {
        return trainerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是专家"));
    }

    private TrainerHighlightResponse toResponseWithFiles(TrainerHighlight h) {
        TrainerHighlightResponse r = TrainerHighlightResponse.from(h);
        List<TrainerHighlightFile> files = highlightFileRepository
                .findByHighlightIdOrderBySortOrderAsc(h.getId());
        r.setFiles(files.stream()
                .map(TrainerHighlightFileResponse::from)
                .collect(Collectors.toList()));
        return r;
    }

    private List<TrainerHighlightResponse> toResponsesWithFiles(List<TrainerHighlight> highlights) {
        if (highlights.isEmpty()) {
            return List.of();
        }
        List<Integer> ids = highlights.stream().map(TrainerHighlight::getId).toList();

        // 单次批量查询所有子文件，避免 N+1
        List<TrainerHighlightFile> allFiles = highlightFileRepository
                .findByHighlightIdInOrderBySortOrderAsc(ids);
        Map<Integer, List<TrainerHighlightFileResponse>> filesMap = allFiles.stream()
                .collect(Collectors.groupingBy(
                        TrainerHighlightFile::getHighlightId,
                        Collectors.mapping(TrainerHighlightFileResponse::from, Collectors.toList())
                ));

        return highlights.stream().map(h -> {
            TrainerHighlightResponse r = TrainerHighlightResponse.from(h);
            r.setFiles(filesMap.getOrDefault(h.getId(), List.of()));
            return r;
        }).collect(Collectors.toList());
    }
}
