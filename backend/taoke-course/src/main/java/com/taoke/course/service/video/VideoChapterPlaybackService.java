package com.taoke.course.service.video;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.video.VideoAccessVO;
import com.taoke.course.dto.video.VideoChapterPlaybackVO;
import com.taoke.course.entity.video.VideoChapter;
import com.taoke.course.repository.video.VideoChapterRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 录播章节第三方播放 URL 签发（需登录 + 权限校验）。
 *
 * @author Fangxinxin
 * @date 2026-06-11 10:00
 */
@Service
@RequiredArgsConstructor
public class VideoChapterPlaybackService {

    private final VideoRepository videoRepository;
    private final VideoChapterRepository videoChapterRepository;
    private final VideoService videoService;
    private final UserService userService;
    private final LegacyThirdPartyPlaybackSigner playbackSigner;
    private final KuanxuePlaybackSigner kuanxuePlaybackSigner;
    private final SchoPlaybackSigner schoPlaybackSigner;

    public VideoChapterPlaybackVO signChapterPlayback(Integer videoId, Integer chapterId, Integer userId) {
        videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));

        VideoChapter chapter = videoChapterRepository.findById(chapterId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "章节不存在"));
        if (!chapter.getVideoId().equals(videoId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "章节不属于此录播课");
        }

        VideoAccessVO access = videoService.checkAccess(videoId, userId);
        boolean previewChapter = chapter.getIsPreview() != null && chapter.getIsPreview() == 1;
        if (!Boolean.TRUE.equals(access.getAccessible()) && !previewChapter) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权播放该章节");
        }

        LegacyThirdPartyPlaybackSigner.SignedPlayback signed;
        if (kuanxuePlaybackSigner.supports(chapter.getVideoUrl())) {
            signed = kuanxuePlaybackSigner.sign(chapter.getVideoUrl());
        } else if (schoPlaybackSigner.supports(chapter.getVideoUrl())) {
            signed = schoPlaybackSigner.sign(chapter.getVideoUrl());
        } else {
            String loginName = resolveLoginName(userId);
            signed = playbackSigner.sign(chapter.getVideoUrl(), userId, loginName);
        }

        VideoChapterPlaybackVO vo = new VideoChapterPlaybackVO();
        vo.setEmbedUrl(signed.embedUrl());
        vo.setProvider(signed.provider());
        vo.setPlaybackMode(signed.playbackMode());
        return vo;
    }

    private String resolveLoginName(Integer userId) {
        List<User> users = userService.findAllByIds(List.of(userId));
        if (users.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");
        }
        User user = users.getFirst();
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().trim();
        }
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname().trim();
        }
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            return user.getPhone().trim();
        }
        throw new BusinessException(ErrorCode.PARAM_INVALID, "用户缺少可用于第三方签发的登录名");
    }
}
