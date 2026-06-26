package com.taoke.course.service.pxb;

import com.taoke.common.enums.BusinessRole;
import com.taoke.course.api.PxbLegacyVideoSyncService;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoChapter;
import com.taoke.course.entity.video.VideoSeries;
import com.taoke.course.enums.VideoStatus;
import com.taoke.course.enums.VideoType;
import com.taoke.course.repository.video.VideoChapterRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.repository.video.VideoSeriesRepository;
import com.taoke.user.api.TrainerService;
import com.taoke.user.entity.Trainer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PxbLegacyVideoSyncServiceImpl implements PxbLegacyVideoSyncService {

    private static final int LEGACY_V_TYPE_PXB = 6;
    private static final String PXB_CDN = "https://cdn5-pxb-videos.taoke.com/";

    private final VideoRepository videoRepository;
    private final VideoChapterRepository videoChapterRepository;
    private final VideoSeriesRepository videoSeriesRepository;
    private final TrainerService trainerService;

    @Override
    @Transactional
    public Map<String, Object> handle(Map<String, Object> payload, int publisherUserId) {
        Optional<Map<String, Object>> validationError = validate(payload);
        if (validationError.isPresent()) {
            return fail(validationError.get());
        }

        if (publisherUserId <= 0) {
            return fail(Map.of("info", "淘课网找不到该用户。", "code", 377));
        }

        String type = stringVal(payload.get("type"));
        @SuppressWarnings("unchecked")
        Map<String, Object> videoMap = (Map<String, Object>) payload.get("video");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> seriesList = payload.get("series") instanceof List<?> list
                ? list.stream().filter(Map.class::isInstance).map(item -> (Map<String, Object>) item).toList()
                : List.of();

        return switch (type) {
            case "add" -> addVideo(videoMap, seriesList, publisherUserId);
            case "update" -> updateVideo(videoMap, seriesList, publisherUserId);
            case "delete" -> deleteVideo(videoMap, publisherUserId);
            default -> fail(Map.of("info", "未知类型", "code", 670));
        };
    }

    private Map<String, Object> addVideo(Map<String, Object> videoMap,
                                         List<Map<String, Object>> seriesList,
                                         int publisherUserId) {
        int pxbId = intVal(videoMap.get("pxb_id"));
        Video video = new Video();
        applyVideoFields(video, videoMap);
        video.setPublisherId(publisherUserId);
        video.setPublisherType(BusinessRole.Code.TRAINER);
        video.setLegacyVType(LEGACY_V_TYPE_PXB);
        video.setPxbSupplierId(pxbId);
        video.setVideoType(VideoType.SERIES);
        video.setStatus(VideoStatus.PENDING.getValue());
        bindTrainerId(video, publisherUserId);
        video = videoRepository.save(video);

        Map<Integer, Integer> seriesRelation = upsertSeries(video.getId(), seriesList);
        refreshVideoStats(video.getId());

        return success("添加成功", pxbId, video.getId(), seriesRelation);
    }

    private Map<String, Object> updateVideo(Map<String, Object> videoMap,
                                             List<Map<String, Object>> seriesList,
                                             int publisherUserId) {
        int taokeId = intVal(videoMap.get("taoke_id"));
        int pxbId = intVal(videoMap.get("pxb_id"));
        Video video = videoRepository.findById(taokeId).orElse(null);
        if (video == null || !Objects.equals(video.getPublisherId(), publisherUserId)) {
            return fail(Map.of("info", "更新失败", "code", 636));
        }

        applyVideoFields(video, videoMap);
        video.setLegacyVType(LEGACY_V_TYPE_PXB);
        video.setPxbSupplierId(pxbId);
        video.setStatus(VideoStatus.PENDING.getValue());
        videoRepository.save(video);

        Map<Integer, Integer> seriesRelation = upsertSeries(video.getId(), seriesList);
        refreshVideoStats(video.getId());

        return success("更新成功", pxbId, video.getId(), seriesRelation);
    }

    private Map<String, Object> deleteVideo(Map<String, Object> videoMap, int publisherUserId) {
        int taokeId = intVal(videoMap.get("taoke_id"));
        int pxbId = intVal(videoMap.get("pxb_id"));
        Video video = videoRepository.findById(taokeId).orElse(null);
        if (video == null || !Objects.equals(video.getPublisherId(), publisherUserId)) {
            return fail(Map.of("info", "删除失败", "code", 664));
        }

        video.setStatus(VideoStatus.UNPUBLISHED.getValue());
        videoRepository.save(video);

        List<VideoSeries> series = videoSeriesRepository.findByVideoIdOrderBySortOrderAsc(taokeId);
        for (VideoSeries item : series) {
            videoChapterRepository.deleteBySeriesId(item.getId());
            videoSeriesRepository.delete(item);
        }
        videoChapterRepository.deleteByVideoId(taokeId);

        Map<Integer, Integer> seriesRelation = new LinkedHashMap<>();
        return success("删除成功", pxbId, taokeId, seriesRelation);
    }

    private Map<Integer, Integer> upsertSeries(int videoId,
                                               List<Map<String, Object>> seriesList) {
        Map<Integer, Integer> relation = new LinkedHashMap<>();
        int currentSeriesId = 0;
        int sortOrder = 0;

        for (Map<String, Object> item : seriesList) {
            int types = intVal(item.get("types"));
            if (types == 2) {
                VideoSeries series = new VideoSeries();
                series.setVideoId(videoId);
                series.setTitle(stringVal(item.get("title")));
                series.setDescription(stringVal(item.get("description")));
                series.setCoverUrl(normalizeMediaUrl(stringVal(item.get("pic"))));
                series.setSortOrder(++sortOrder);
                series = videoSeriesRepository.save(series);
                currentSeriesId = series.getId();
                continue;
            }
            if (types != 1) {
                continue;
            }

            int pxbSeriesId = intVal(item.get("pxb_id"));
            VideoChapter chapter = videoChapterRepository
                    .findFirstByVideoIdAndPxbSupplierId(videoId, pxbSeriesId)
                    .orElseGet(VideoChapter::new);
            chapter.setVideoId(videoId);
            chapter.setSeriesId(currentSeriesId);
            chapter.setTitle(stringVal(item.get("title")));
            chapter.setDescription(stringVal(item.get("description")));
            chapter.setVideoUrl(resolveEpisodeUrl(item));
            chapter.setCoverUrl(normalizeMediaUrl(stringVal(item.get("pic"))));
            chapter.setDuration(intVal(item.get("duration")));
            chapter.setSortOrder(intVal(item.get("sortorder")) > 0 ? intVal(item.get("sortorder")) : ++sortOrder);
            chapter.setIsPreview(intVal(item.get("preview")) > 0 ? 1 : 0);
            chapter.setPxbSupplierId(pxbSeriesId);
            chapter.setFileSize(longVal(item.get("online_size")));
            chapter = videoChapterRepository.save(chapter);
            relation.put(pxbSeriesId, chapter.getId());
        }
        return relation;
    }

    private void applyVideoFields(Video video, Map<String, Object> videoMap) {
        if (videoMap.containsKey("title")) {
            video.setTitle(stringVal(videoMap.get("title")));
        }
        if (videoMap.containsKey("intro")) {
            video.setIntro(stringVal(videoMap.get("intro")));
        }
        if (videoMap.containsKey("pic")) {
            video.setCoverUrl(normalizeMediaUrl(stringVal(videoMap.get("pic"))));
        }
        if (videoMap.containsKey("duration")) {
            video.setDuration(intVal(videoMap.get("duration")));
        }
        if (videoMap.containsKey("tag")) {
            video.setKeywords(stringVal(videoMap.get("tag")));
        }
        if (videoMap.containsKey("teacher")) {
            video.setTeacherName(stringVal(videoMap.get("teacher")));
        }
        if (videoMap.containsKey("video_price")) {
            video.setPrice(toDecimal(videoMap.get("video_price")));
        }
        if (videoMap.containsKey("company_price")) {
            BigDecimal companyPrice = toDecimal(videoMap.get("company_price"));
            BigDecimal videoPrice = video.getPrice() != null ? video.getPrice() : BigDecimal.ZERO;
            if (videoPrice.compareTo(BigDecimal.ZERO) <= 0
                    || companyPrice.compareTo(videoPrice) < 0) {
                video.setCompanyPrice(BigDecimal.ZERO);
            } else {
                video.setCompanyPrice(companyPrice);
            }
        }
    }

    private void bindTrainerId(Video video, int publisherUserId) {
        List<Trainer> trainers = trainerService.findByUserIds(List.of(publisherUserId));
        if (!trainers.isEmpty()) {
            video.setTrainerId(trainers.get(0).getId());
        }
    }

    private void refreshVideoStats(Integer videoId) {
        Video video = videoRepository.findById(videoId).orElse(null);
        if (video == null) {
            return;
        }
        List<VideoChapter> chapters = videoChapterRepository.findByVideoIdOrderBySortOrderAsc(videoId);
        video.setTotalEpisodes(chapters.size());
        int totalDuration = chapters.stream().mapToInt(VideoChapter::getDuration).sum();
        if (totalDuration <= 0 && video.getDuration() != null) {
            totalDuration = video.getDuration();
        }
        video.setDuration(totalDuration);
        videoRepository.save(video);
    }

    private Optional<Map<String, Object>> validate(Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("type") || !payload.containsKey("video")) {
            return Optional.of(Map.of("info", "数据格式不正确。", "code", 443));
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> video = (Map<String, Object>) payload.get("video");
        String type = stringVal(payload.get("type"));
        if (intVal(video.get("pxb_id")) <= 0) {
            return Optional.of(Map.of(
                    "type", type,
                    "info", "课程Id不能为空。",
                    "title", stringVal(video.get("title")),
                    "code", 449));
        }
        if ("add".equals(type) && intVal(video.get("taoke_id")) > 0) {
            return Optional.of(Map.of("type", type, "info", "课程数据错误，Taoke_id应该为空。", "code", 457));
        }
        if (!"add".equals(type) && intVal(video.get("taoke_id")) <= 0) {
            return Optional.of(Map.of("type", type, "info", "课程数据不完整，Taoke_id不能为空。", "code", 464));
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> series = payload.get("series") instanceof List<?> list
                ? list.stream().filter(Map.class::isInstance).map(item -> (Map<String, Object>) item).toList()
                : List.of();
        for (Map<String, Object> item : series) {
            if (intVal(item.get("types")) != 1) {
                continue;
            }
            if (intVal(item.get("pxb_id")) <= 0) {
                return Optional.of(Map.of(
                        "type", type,
                        "info", "系列数据不完整，pxb_id不能为空。",
                        "title", stringVal(item.get("title")),
                        "code", 475));
            }
            if ("add".equals(type) && intVal(item.get("taoke_id")) > 0) {
                return Optional.of(Map.of(
                        "type", type,
                        "info", "系列数据错误，Taoke_id应该为空。",
                        "title", stringVal(item.get("title")),
                        "code", 481));
            }
            if ("delete".equals(type) && intVal(item.get("taoke_id")) <= 0) {
                return Optional.of(Map.of(
                        "type", type,
                        "info", "系列数据不完整，Taoke_id不能为空。",
                        "title", stringVal(item.get("title")),
                        "code", 488));
            }
        }
        return Optional.empty();
    }

    private static String resolveEpisodeUrl(Map<String, Object> item) {
        int medioType = intVal(item.get("medio_type"));
        if (medioType == 0 && StringUtils.hasText(stringVal(item.get("key")))) {
            return normalizeMediaUrl(stringVal(item.get("key")));
        }
        return normalizeMediaUrl(stringVal(item.get("url")));
    }

    private static String normalizeMediaUrl(String url) {
        if (!StringUtils.hasText(url)) {
            return "";
        }
        String trimmed = url.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        return PXB_CDN + trimmed.replaceFirst("^/+", "");
    }

    private static Map<String, Object> success(String info,
                                               int pxbId,
                                               int taokeId,
                                               Map<Integer, Integer> seriesRelation) {
        Map<String, Object> msg = new LinkedHashMap<>();
        msg.put("info", info);
        msg.put("pxb_id", pxbId);
        msg.put("taoke_id", taokeId);
        msg.put("seriesRelation", seriesRelation);
        return Map.of("isok", true, "msg", msg);
    }

    private static Map<String, Object> fail(Map<String, Object> msg) {
        return Map.of("isok", false, "msg", msg);
    }

    private static String stringVal(Object raw) {
        return raw != null ? String.valueOf(raw).trim() : "";
    }

    private static int intVal(Object raw) {
        if (raw == null) {
            return 0;
        }
        if (raw instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static long longVal(Object raw) {
        if (raw == null) {
            return 0L;
        }
        if (raw instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private static BigDecimal toDecimal(Object raw) {
        if (raw == null) {
            return BigDecimal.ZERO;
        }
        if (raw instanceof BigDecimal decimal) {
            return decimal;
        }
        if (raw instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        try {
            return new BigDecimal(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}
