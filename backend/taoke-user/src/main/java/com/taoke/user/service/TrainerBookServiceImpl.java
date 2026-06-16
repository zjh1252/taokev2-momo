package com.taoke.user.service;

import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.user.TrainerBookApprovedEvent;
import com.taoke.common.events.user.TrainerBookRejectedEvent;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.TrainerBookService;
import com.taoke.user.dto.trainerbook.SaveTrainerBookRequest;
import com.taoke.user.dto.trainerbook.TrainerBookResponse;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerBook;
import com.taoke.user.repository.TrainerBookRepository;
import com.taoke.user.repository.TrainerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 专家著作业务实现
 *
 * @author Fangxinxin
 * @date 2026-04-16 15:30
 */
@Service
@RequiredArgsConstructor
public class TrainerBookServiceImpl implements TrainerBookService {

    private final TrainerBookRepository bookRepository;
    private final TrainerRepository trainerRepository;
    private final EventPublisher eventPublisher;

    @Override
    public List<TrainerBookResponse> listMyBooks(Integer userId) {
        Trainer trainer = requireTrainer(userId);
        return bookRepository.findByTrainerIdOrderBySortOrderDescIdDesc(trainer.getId())
                .stream().map(TrainerBookResponse::from).toList();
    }

    @Override
    @Transactional
    public TrainerBookResponse createBook(Integer userId, SaveTrainerBookRequest request) {
        Trainer trainer = requireTrainer(userId);
        TrainerBook b = new TrainerBook();
        b.setTrainerId(trainer.getId());
        b.setSubmitterUserId(userId);
        b.setAuthorName(trainer.getName());
        b.setStatus(0);
        applyRequest(b, request);
        if (b.getSortOrder() == null) {
            b.setSortOrder(0);
        }
        bookRepository.save(b);
        return TrainerBookResponse.from(b);
    }

    @Override
    @Transactional
    public TrainerBookResponse updateBook(Integer userId, Integer bookId, SaveTrainerBookRequest request) {
        Trainer trainer = requireTrainer(userId);
        TrainerBook b = requireMyBook(trainer.getId(), bookId);
        applyRequest(b, request);
        bookRepository.save(b);
        return TrainerBookResponse.from(b);
    }

    @Override
    @Transactional
    public void deleteBook(Integer userId, Integer bookId) {
        Trainer trainer = requireTrainer(userId);
        TrainerBook b = requireMyBook(trainer.getId(), bookId);
        bookRepository.delete(b);
    }

    @Override
    @Transactional
    public void batchSort(Integer userId, List<Integer> ids) {
        Trainer trainer = requireTrainer(userId);
        if (ids == null || ids.isEmpty()) return;
        // ids 顺序作为展示顺序：第一个 sort_order 最大，依次递减
        int max = ids.size();
        for (int i = 0; i < ids.size(); i++) {
            TrainerBook b = bookRepository.findById(ids.get(i)).orElse(null);
            if (b != null && b.getTrainerId().equals(trainer.getId())) {
                b.setSortOrder(max - i);
                bookRepository.save(b);
            }
        }
    }

    @Override
    public List<TrainerBookResponse> listPublicBooks(Integer trainerId) {
        if (trainerId == null || trainerId <= 0) return List.of();
        return bookRepository.findByTrainerIdOrderBySortOrderDescIdDesc(trainerId)
                .stream()
                .filter(b -> b.getStatus() != null && b.getStatus() == 1)
                .map(TrainerBookResponse::from).toList();
    }

    @Override
    public Page<TrainerBook> adminSearch(Integer status, String keyword, int page, int size) {
        int pageIndex = page < 1 ? 0 : page - 1;
        Specification<TrainerBook> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), like),
                        cb.like(root.get("authorName"), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return bookRepository.findAll(spec,
                PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "id")));
    }

    @Override
    public TrainerBook adminGetOrThrow(Integer bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "著作不存在"));
    }

    @Override
    @Transactional
    public TrainerBookResponse adminCreate(Integer trainerId, Integer submitterUserId,
                                           SaveTrainerBookRequest request) {
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "专家不存在"));
        TrainerBook b = new TrainerBook();
        b.setTrainerId(trainer.getId());
        b.setSubmitterUserId(submitterUserId);
        b.setAuthorName(request.getAuthorName() != null ? request.getAuthorName() : trainer.getName());
        b.setStatus(1);
        b.setReviewedAt(LocalDateTime.now());
        applyRequest(b, request);
        if (b.getSortOrder() == null) {
            b.setSortOrder(0);
        }
        bookRepository.save(b);
        return TrainerBookResponse.from(b);
    }

    @Override
    @Transactional
    public void adminApprove(Integer bookId, Integer reviewerId) {
        TrainerBook b = adminGetOrThrow(bookId);
        b.setStatus(1);
        b.setRejectReason(null);
        b.setReviewerId(reviewerId);
        b.setReviewedAt(LocalDateTime.now());
        bookRepository.save(b);

        trainerRepository.findById(b.getTrainerId()).ifPresent(trainer -> {
            Integer notifyUserId = b.getSubmitterUserId() != null ? b.getSubmitterUserId() : trainer.getUserId();
            if (notifyUserId != null) {
                eventPublisher.publish(new TrainerBookApprovedEvent(bookId, b.getTitle(), notifyUserId));
            }
        });
    }

    @Override
    @Transactional
    public void adminReject(Integer bookId, Integer reviewerId, String reason) {
        TrainerBook b = adminGetOrThrow(bookId);
        b.setStatus(2);
        b.setRejectReason(reason);
        b.setReviewerId(reviewerId);
        b.setReviewedAt(LocalDateTime.now());
        bookRepository.save(b);

        trainerRepository.findById(b.getTrainerId()).ifPresent(trainer -> {
            Integer notifyUserId = b.getSubmitterUserId() != null ? b.getSubmitterUserId() : trainer.getUserId();
            if (notifyUserId != null) {
                eventPublisher.publish(new TrainerBookRejectedEvent(
                        bookId, b.getTitle(), notifyUserId, reason));
            }
        });
    }

    // ==================== 内部方法 ====================

    private Trainer requireTrainer(Integer userId) {
        return trainerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是专家"));
    }

    private TrainerBook requireMyBook(Integer trainerId, Integer bookId) {
        TrainerBook b = bookRepository.findById(bookId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "著作不存在"));
        if (!b.getTrainerId().equals(trainerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作他人著作");
        }
        return b;
    }

    private void applyRequest(TrainerBook b, SaveTrainerBookRequest req) {
        b.setTitle(req.getTitle());
        if (req.getAuthorName() != null) {
            b.setAuthorName(req.getAuthorName());
        }
        b.setCoverUrl(req.getCoverUrl());
        b.setPublisher(req.getPublisher());
        b.setPublishDate(req.getPublishDate());
        b.setDescription(req.getDescription());
        b.setBuyUrl(req.getBuyUrl());
        if (req.getSortOrder() != null) {
            b.setSortOrder(req.getSortOrder());
        }
    }
}
