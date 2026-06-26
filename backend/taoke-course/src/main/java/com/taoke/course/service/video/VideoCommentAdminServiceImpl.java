package com.taoke.course.service.video;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.VideoCommentAdminService;
import com.taoke.course.dto.video.AdminVideoCommentListItemVO;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoComment;
import com.taoke.course.repository.video.VideoCommentRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 录播课评论管理实现
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Service
@RequiredArgsConstructor
public class VideoCommentAdminServiceImpl implements VideoCommentAdminService {

    private static final Map<Integer, String> AUDIT_LABELS = Map.of(
            0, "待审核",
            1, "已通过",
            2, "已驳回"
    );

    private final VideoCommentRepository videoCommentRepository;
    private final VideoRepository videoRepository;
    private final UserRoleService userRoleService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminVideoCommentListItemVO> list(Integer auditStatus, String keyword,
                                                           Integer videoId, int page, int size) {
        int safePage = Math.max(1, page);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);

        Specification<VideoComment> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (auditStatus != null) {
                predicates.add(cb.equal(root.get("auditStatus"), auditStatus));
            }
            if (videoId != null) {
                predicates.add(cb.equal(root.get("videoId"), videoId));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("content"), like),
                        cb.like(root.get("userName"), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Page<VideoComment> commentPage = videoCommentRepository.findAll(
                spec, PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "id")));

        if (commentPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, safePage, safeSize);
        }

        List<VideoComment> comments = commentPage.getContent();
        Set<Integer> videoIds = comments.stream().map(VideoComment::getVideoId).collect(Collectors.toSet());
        Map<Integer, String> videoTitleMap = videoRepository.findAllById(videoIds).stream()
                .collect(Collectors.toMap(Video::getId, Video::getTitle));

        List<Integer> userIds = comments.stream()
                .map(VideoComment::getUserId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        Map<Integer, String> roleLabelMap = buildRoleLabelMap(userIds);

        List<AdminVideoCommentListItemVO> items = comments.stream().map(c -> {
            AdminVideoCommentListItemVO vo = new AdminVideoCommentListItemVO();
            vo.setId(c.getId());
            vo.setVideoId(c.getVideoId());
            vo.setVideoTitle(videoTitleMap.getOrDefault(c.getVideoId(), ""));
            vo.setUserId(c.getUserId());
            vo.setUserName(c.getUserName());
            vo.setUserRoleLabel(roleLabelMap.getOrDefault(c.getUserId(), "学员"));
            vo.setContent(c.getContent());
            vo.setAuditStatus(c.getAuditStatus());
            vo.setAuditStatusLabel(AUDIT_LABELS.getOrDefault(c.getAuditStatus(), "未知"));
            vo.setRejectReason(c.getRejectReason());
            vo.setCreatedAt(c.getCreatedAt());
            return vo;
        }).toList();

        return PageResponse.of(items, commentPage.getTotalElements(), safePage, safeSize);
    }

    @Override
    @Transactional
    public void approve(Integer id) {
        VideoComment comment = getComment(id);
        comment.setAuditStatus(1);
        comment.setVisible(true);
        comment.setRejectReason("");
        videoCommentRepository.save(comment);
    }

    @Override
    @Transactional
    public void reject(Integer id, String reason) {
        VideoComment comment = getComment(id);
        comment.setAuditStatus(2);
        comment.setVisible(false);
        comment.setRejectReason(reason == null ? "" : reason.trim());
        videoCommentRepository.save(comment);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        videoCommentRepository.delete(getComment(id));
    }

    @Override
    @Transactional
    public void batchApprove(List<Integer> ids) {
        if (ids == null) {
            return;
        }
        ids.forEach(this::approve);
    }

    @Override
    @Transactional
    public void batchReject(List<Integer> ids, String reason) {
        if (ids == null) {
            return;
        }
        ids.forEach(id -> reject(id, reason));
    }

    @Override
    @Transactional
    public void batchDelete(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        videoCommentRepository.deleteAllById(ids);
    }

    private VideoComment getComment(Integer id) {
        return videoCommentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "评论不存在"));
    }

    private Map<Integer, String> buildRoleLabelMap(List<Integer> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        Map<Integer, List<UserRole>> rolesByUser = userRoleService.findByUserIds(userIds).stream()
                .filter(r -> r.getStatus() != null && r.getStatus() == 1)
                .collect(Collectors.groupingBy(UserRole::getUserId));

        Map<Integer, String> result = new HashMap<>();
        for (Integer userId : userIds) {
            List<UserRole> roles = rolesByUser.getOrDefault(userId, List.of());
            String label = roles.stream()
                    .map(UserRole::getRole)
                    .map(this::roleLabel)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse("学员");
            result.put(userId, label);
        }
        return result;
    }

    private String roleLabel(String roleCode) {
        for (BusinessRole role : BusinessRole.values()) {
            if (role.name().equals(roleCode)) {
                return role.getLabel();
            }
        }
        return null;
    }
}
