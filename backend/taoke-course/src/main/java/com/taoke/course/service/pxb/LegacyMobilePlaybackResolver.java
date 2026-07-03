package com.taoke.course.service.pxb;

import com.taoke.common.exception.BusinessException;
import com.taoke.course.dto.pxb.PxbLegacyMobilePlaybackResult;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoChapter;
import com.taoke.course.repository.video.VideoChapterRepository;
import com.taoke.course.service.video.KuanxuePlaybackSigner;
import com.taoke.course.service.video.LegacyLocalVideoUrlResolver;
import com.taoke.course.service.video.LegacyNetworkVideoConverter;
import com.taoke.course.service.video.LegacyPxbVideoUrlResolver;
import com.taoke.course.service.video.LegacyThirdPartyPlaybackSigner;
import com.taoke.course.service.video.SchoPlaybackSigner;
import com.taoke.course.service.video.ZgxPlaybackSigner;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Objects;

/**
 * taokevideo pxbmobile 播放 URL 签发（按老站 v_type 分支，不含购买校验）。
 */
@Service
@RequiredArgsConstructor
public class LegacyMobilePlaybackResolver {

    private static final int LEGACY_V_TYPE_PXB = 6;

    private final VideoChapterRepository videoChapterRepository;
    private final UserService userService;
    private final LegacyLocalVideoUrlResolver localVideoUrlResolver;
    private final LegacyPxbVideoUrlResolver pxbVideoUrlResolver;
    private final LegacyNetworkVideoConverter networkVideoConverter;
    private final KuanxuePlaybackSigner kuanxuePlaybackSigner;
    private final SchoPlaybackSigner schoPlaybackSigner;
    private final LegacyThirdPartyPlaybackSigner thirdPartyPlaybackSigner;
    private final ZgxPlaybackSigner zgxPlaybackSigner;

    public PxbLegacyMobilePlaybackResult resolveSignedPlayback(Video video,
                                                             Integer chapterId,
                                                             Integer userId) {
        int vType = resolveLegacyVType(video);
        VideoChapter chapter = resolveChapter(video, chapterId);
        String storedUrl = resolveStoredPlayUrl(video, chapter);
        String poster = chapter != null && StringUtils.hasText(chapter.getCoverUrl())
                ? chapter.getCoverUrl() : video.getCoverUrl();
        long size = chapter != null && chapter.getFileSize() != null ? chapter.getFileSize() : 0L;

        try {
            return buildPlayback(video, vType, storedUrl, poster, size, userId);
        } catch (BusinessException e) {
            return PxbLegacyMobilePlaybackResult.reject(
                    PxbLegacyMobilePlaybackResult.RejectReason.PLAYBACK_FAILED,
                    playbackErrorMessage(vType, e));
        } catch (Exception e) {
            return PxbLegacyMobilePlaybackResult.reject(
                    PxbLegacyMobilePlaybackResult.RejectReason.PLAYBACK_FAILED,
                    playbackErrorMessage(vType, null));
        }
    }

    private PxbLegacyMobilePlaybackResult buildPlayback(Video video,
                                                        int vType,
                                                        String storedUrl,
                                                        String poster,
                                                        long size,
                                                        Integer userId) {
        return switch (vType) {
            case 1 -> localPlayback(vType, storedUrl, poster, size, video.getPublisherId());
            case 2 -> networkPlayback(vType, storedUrl, poster, size, false);
            case 4, 5 -> thirdPartyPlayback(vType, storedUrl, poster, size, userId);
            case 6 -> pxbSharedPlayback(storedUrl, poster, size);
            case 7 -> kuanxuePlayback(vType, storedUrl, poster, size);
            case 8 -> supplierPlayback(vType, storedUrl, poster, size);
            case 9, 10, 11 -> zgxPlayback(vType, storedUrl, poster, size, video.getVideoUrl());
            default -> localPlayback(1, storedUrl, poster, size, video.getPublisherId());
        };
    }

    private PxbLegacyMobilePlaybackResult localPlayback(int vType,
                                                        String storedUrl,
                                                        String poster,
                                                        long size,
                                                        Integer publisherId) {
        String playUrl = localVideoUrlResolver.resolve(storedUrl, publisherId != null ? publisherId : 0);
        if (!StringUtils.hasText(playUrl)) {
            throw new BusinessException(com.taoke.common.exception.ErrorCode.PARAM_INVALID, "资源已删除,请联系供应商。");
        }
        return PxbLegacyMobilePlaybackResult.playback(
                vType,
                false,
                playUrl,
                localVideoUrlResolver.resolvePoster(playUrl, poster),
                false,
                size);
    }

    private PxbLegacyMobilePlaybackResult networkPlayback(int vType,
                                                          String storedUrl,
                                                          String poster,
                                                          long size,
                                                          boolean online) {
        String playUrl = networkVideoConverter.convertForMobile(storedUrl);
        return PxbLegacyMobilePlaybackResult.playback(vType, false, playUrl, poster, online, size);
    }

    private PxbLegacyMobilePlaybackResult pxbSharedPlayback(String storedUrl, String poster, long size) {
        String normalized = pxbVideoUrlResolver.fixMisMigratedFullUrl(storedUrl);
        if (networkVideoConverter.isNetworkEmbedUrl(normalized)) {
            return networkPlayback(LEGACY_V_TYPE_PXB, normalized, poster, size, true);
        }
        String playUrl = pxbVideoUrlResolver.resolve(normalized);
        if (!StringUtils.hasText(playUrl)) {
            throw new BusinessException(com.taoke.common.exception.ErrorCode.PARAM_INVALID, "资源已删除,请联系供应商。");
        }
        return PxbLegacyMobilePlaybackResult.playback(
                LEGACY_V_TYPE_PXB,
                false,
                playUrl,
                resolvePoster(poster),
                false,
                size);
    }

    private String resolveStoredPlayUrl(Video video, VideoChapter chapter) {
        String fromChapter = chapter != null ? chapter.getVideoUrl() : null;
        String fromVideo = video.getVideoUrl();
        String stored = StringUtils.hasText(fromChapter) ? fromChapter : fromVideo;
        if (!StringUtils.hasText(stored) || isLegacyVidChildToken(stored)) {
            return "";
        }
        return stored.trim();
    }

    private static boolean isLegacyVidChildToken(String value) {
        String trimmed = value.trim();
        return trimmed.startsWith("vid=") && trimmed.contains("child=");
    }

    private String resolvePoster(String poster) {
        if (poster != null && poster.startsWith("http")) {
            return poster;
        }
        return poster != null ? poster : "";
    }

    private PxbLegacyMobilePlaybackResult kuanxuePlayback(int vType,
                                                          String storedUrl,
                                                          String poster,
                                                          long size) {
        LegacyThirdPartyPlaybackSigner.SignedPlayback signed = kuanxuePlaybackSigner.sign(storedUrl);
        if (!StringUtils.hasText(signed.embedUrl())) {
            throw new BusinessException(com.taoke.common.exception.ErrorCode.INTERNAL_ERROR, "太火爆了，请稍后再试");
        }
        return PxbLegacyMobilePlaybackResult.playback(vType, false, signed.embedUrl(), poster, false, size);
    }

    private PxbLegacyMobilePlaybackResult thirdPartyPlayback(int vType,
                                                             String storedUrl,
                                                             String poster,
                                                             long size,
                                                             Integer userId) {
        String loginName = resolveLoginName(userId);
        LegacyThirdPartyPlaybackSigner.SignedPlayback signed =
                thirdPartyPlaybackSigner.sign(storedUrl, userId != null ? userId : 0, loginName);
        return PxbLegacyMobilePlaybackResult.playback(vType, false, signed.embedUrl(), poster, false, size);
    }

    private PxbLegacyMobilePlaybackResult supplierPlayback(int vType,
                                                           String storedUrl,
                                                           String poster,
                                                           long size) {
        LegacyThirdPartyPlaybackSigner.SignedPlayback signed = schoPlaybackSigner.sign(storedUrl);
        return PxbLegacyMobilePlaybackResult.playback(vType, true, signed.embedUrl(), poster, false, size);
    }

    private PxbLegacyMobilePlaybackResult zgxPlayback(int vType,
                                                      String storedUrl,
                                                      String poster,
                                                      long size,
                                                      String fallbackPath) {
        String path = StringUtils.hasText(storedUrl) ? storedUrl : fallbackPath;
        boolean aliOss = ZgxPlaybackSigner.inferAliOss(vType, path);
        LegacyThirdPartyPlaybackSigner.SignedPlayback signed = zgxPlaybackSigner.sign(path, vType, aliOss);
        boolean supplierPage = vType == 8 || vType == 9 || vType == 10;
        return PxbLegacyMobilePlaybackResult.playback(
                vType, supplierPage, signed.embedUrl(), poster, false, size);
    }

    static int resolveLegacyVType(Video video) {
        if (video.getLegacyVType() != null && video.getLegacyVType() > 0) {
            return video.getLegacyVType();
        }
        return PxbLegacyVideoQueryServiceImpl.inferLegacyVType(video.getVideoUrl());
    }

    private VideoChapter resolveChapter(Video video, Integer chapterId) {
        if (chapterId != null && chapterId > 0) {
            return videoChapterRepository.findById(chapterId)
                    .filter(c -> Objects.equals(c.getVideoId(), video.getId()))
                    .orElse(null);
        }
        List<VideoChapter> chapters = videoChapterRepository.findByVideoIdOrderBySortOrderAsc(video.getId());
        return chapters.isEmpty() ? null : chapters.getFirst();
    }

    private String resolveLoginName(Integer userId) {
        if (userId == null || userId <= 0) {
            return "guest";
        }
        List<User> users = userService.findAllByIds(List.of(userId));
        if (users.isEmpty()) {
            return "user" + userId;
        }
        User user = users.getFirst();
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername().trim();
        }
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname().trim();
        }
        return "user" + userId;
    }

    private static String playbackErrorMessage(int vType, BusinessException e) {
        if (e != null && StringUtils.hasText(e.getMessage())) {
            return e.getMessage();
        }
        if (vType == LEGACY_V_TYPE_PXB) {
            return "资源已删除,请联系供应商。";
        }
        if (vType == 7) {
            return "太火爆了，请稍后再试";
        }
        return "课件已删除，请联系供应商。";
    }
}
