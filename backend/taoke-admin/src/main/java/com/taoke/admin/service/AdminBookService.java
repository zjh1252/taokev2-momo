package com.taoke.admin.service;

import com.taoke.admin.dto.AdminBookVO;
import com.taoke.common.dto.PageResult;
import com.taoke.user.api.TrainerBookService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.api.UserService;
import com.taoke.user.dto.trainerbook.SaveTrainerBookRequest;
import com.taoke.user.dto.trainerbook.TrainerBookResponse;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerBook;
import com.taoke.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 后台著作管理编排服务
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:30
 */
@Service
@RequiredArgsConstructor
public class AdminBookService {

    private final TrainerBookService trainerBookService;
    private final TrainerService trainerService;
    private final UserService userService;

    public PageResult<AdminBookVO> list(Integer status, String keyword, int page, int size) {
        Page<TrainerBook> bookPage = trainerBookService.adminSearch(status, keyword, page, size);
        List<TrainerBook> books = bookPage.getContent();
        if (books.isEmpty()) {
            return PageResult.of(bookPage.getTotalElements(), page, size, List.of());
        }

        List<Integer> trainerIds = books.stream().map(TrainerBook::getTrainerId).distinct().toList();
        Map<Integer, Trainer> trainerMap = trainerService.findByIds(trainerIds).stream()
                .collect(Collectors.toMap(Trainer::getId, Function.identity()));

        List<Integer> userIds = books.stream()
                .map(TrainerBook::getSubmitterUserId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        Map<Integer, User> userMap = userIds.isEmpty()
                ? Map.of()
                : userService.findAllByIds(userIds).stream()
                        .collect(Collectors.toMap(User::getId, Function.identity()));

        List<AdminBookVO> list = books.stream().map(b -> toVo(b, trainerMap, userMap)).toList();
        return PageResult.of(bookPage.getTotalElements(), page, size, list);
    }

    public AdminBookVO getDetail(Integer id) {
        TrainerBook book = trainerBookService.adminGetOrThrow(id);
        Trainer trainer = trainerService.findByIds(List.of(book.getTrainerId())).stream()
                .findFirst().orElse(null);
        User submitter = book.getSubmitterUserId() != null
                ? userService.findAllByIds(List.of(book.getSubmitterUserId())).stream().findFirst().orElse(null)
                : null;
        Map<Integer, Trainer> trainerMap = trainer != null
                ? Map.of(trainer.getId(), trainer) : Map.of();
        Map<Integer, User> userMap = submitter != null
                ? Map.of(submitter.getId(), submitter) : Map.of();
        return toVo(book, trainerMap, userMap);
    }

    public TrainerBookResponse create(Integer trainerId, Integer operatorId, SaveTrainerBookRequest request) {
        return trainerBookService.adminCreate(trainerId, operatorId, request);
    }

    public void approve(Integer id, Integer reviewerId) {
        trainerBookService.adminApprove(id, reviewerId);
    }

    public void reject(Integer id, Integer reviewerId, String reason) {
        trainerBookService.adminReject(id, reviewerId, reason);
    }

    private AdminBookVO toVo(TrainerBook b, Map<Integer, Trainer> trainerMap, Map<Integer, User> userMap) {
        AdminBookVO vo = new AdminBookVO();
        vo.setId(b.getId());
        vo.setCoverUrl(b.getCoverUrl());
        vo.setTitle(b.getTitle());
        vo.setAuthorName(b.getAuthorName());
        vo.setTrainerId(b.getTrainerId());
        Trainer trainer = trainerMap.get(b.getTrainerId());
        if (trainer != null) {
            vo.setTrainerName(trainer.getName());
        }
        vo.setSubmitterUserId(b.getSubmitterUserId());
        if (b.getSubmitterUserId() != null) {
            User u = userMap.get(b.getSubmitterUserId());
            if (u != null) {
                vo.setSubmitterNickname(u.getNickname());
            }
        }
        vo.setCreatedAt(b.getCreatedAt());
        vo.setStatus(b.getStatus());
        vo.setStatusLabel(bookStatusLabel(b.getStatus()));
        vo.setRejectReason(b.getRejectReason());
        vo.setPublisher(b.getPublisher());
        vo.setPublishDate(b.getPublishDate());
        vo.setDescription(b.getDescription());
        vo.setBuyUrl(b.getBuyUrl());
        vo.setReviewedAt(b.getReviewedAt());
        return vo;
    }

    private static String bookStatusLabel(Integer status) {
        if (status == null) {
            return "-";
        }
        return switch (status) {
            case 0 -> "待审核";
            case 1 -> "已通过";
            case 2 -> "已驳回";
            default -> "未知";
        };
    }
}
