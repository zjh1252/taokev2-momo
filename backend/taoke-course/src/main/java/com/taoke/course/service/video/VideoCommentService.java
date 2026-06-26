package com.taoke.course.service.video;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.video.SubmitVideoCommentRequest;
import com.taoke.course.dto.video.VideoCommentVO;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoComment;
import com.taoke.course.enums.VideoStatus;
import com.taoke.course.repository.video.VideoCommentRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.user.api.UserService;
import com.taoke.user.dto.user.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 录播课评论服务
 *
 * @author Fangxinxin
 * @date 2026-06-10 16:00
 */
@Service
@RequiredArgsConstructor
public class VideoCommentService {

    private final VideoCommentRepository videoCommentRepository;
    private final VideoRepository videoRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public PageResponse<VideoCommentVO> listPublic(Integer videoId, int page, int size) {
        assertPublishedVideo(videoId);
        int pageIndex = Math.max(0, page);
        int pageSize = size <= 0 ? 10 : Math.min(size, 50);
        Page<VideoComment> commentPage = videoCommentRepository.findByVideoIdAndAuditStatusOrderByCreatedAtDesc(
                videoId, 1, PageRequest.of(pageIndex, pageSize));
        return PageResponse.of(
                commentPage.getContent().stream().map(this::toVO).toList(),
                commentPage.getTotalElements(),
                pageIndex + 1,
                pageSize);
    }

    @Transactional(readOnly = true)
    public long countPublic(Integer videoId) {
        assertPublishedVideo(videoId);
        return videoCommentRepository.countByVideoIdAndAuditStatus(videoId, 1);
    }

    @Transactional
    public Integer submit(Integer userId, Integer videoId, SubmitVideoCommentRequest request) {
        assertPublishedVideo(videoId);
        VideoComment comment = new VideoComment();
        comment.setVideoId(videoId);
        comment.setUserId(userId);
        comment.setUserName(resolveUserName(userId));
        comment.setContent(request.getContent().trim());
        comment.setRating(request.getRating());
        comment.setAuditStatus(0);
        comment.setVisible(false);
        videoCommentRepository.save(comment);
        return comment.getId();
    }

    private void assertPublishedVideo(Integer videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        if (video.getStatus() != VideoStatus.PUBLISHED.getValue()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在");
        }
    }

    private String resolveUserName(Integer userId) {
        try {
            UserProfileResponse profile = userService.getProfile(userId);
            if (profile.getNickname() != null && !profile.getNickname().isBlank()) {
                return profile.getNickname().trim();
            }
            if (profile.getRealName() != null && !profile.getRealName().isBlank()) {
                return profile.getRealName().trim();
            }
            if (profile.getPhone() != null && !profile.getPhone().isBlank()) {
                return profile.getPhone().trim();
            }
        } catch (Exception ignored) {
        }
        return "学员";
    }

    private VideoCommentVO toVO(VideoComment comment) {
        VideoCommentVO vo = new VideoCommentVO();
        vo.setId(comment.getId());
        vo.setVideoId(comment.getVideoId());
        vo.setUserName(comment.getUserName());
        vo.setContent(comment.getContent());
        vo.setRating(comment.getRating());
        vo.setCreatedAt(comment.getCreatedAt());
        return vo;
    }
}
