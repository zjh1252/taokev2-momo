package com.taoke.course.service.pxb;

import com.taoke.common.response.PageResponse;
import com.taoke.common.service.CategoryService;
import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.course.dto.pxb.PxbLegacyVideoRow;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoChapter;
import com.taoke.course.entity.video.VideoEnrollment;
import com.taoke.course.entity.video.VideoSeries;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.enums.VideoStatus;
import com.taoke.course.repository.order.OrderItemRepository;
import com.taoke.course.repository.order.OrderRepository;
import com.taoke.course.repository.video.VideoChapterRepository;
import com.taoke.course.repository.video.VideoEnrollmentRepository;
import com.taoke.course.repository.video.VideoPackageGroupRepository;
import com.taoke.course.repository.video.VideoPackageRelationRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.repository.video.VideoSeriesRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 培训宝 legacy 录播课查询实现。
 */
@Service
@RequiredArgsConstructor
public class PxbLegacyVideoQueryServiceImpl implements PxbLegacyVideoQueryService {

    private static final int SOON_EXPIRE_DAYS = 30;

    private final VideoRepository videoRepository;
    private final VideoChapterRepository videoChapterRepository;
    private final VideoSeriesRepository videoSeriesRepository;
    private final VideoEnrollmentRepository videoEnrollmentRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final VideoPackageGroupRepository videoPackageGroupRepository;
    private final VideoPackageRelationRepository videoPackageRelationRepository;
    private final CategoryService categoryService;

    @Override
    public PageResponse<PxbLegacyVideoRow> searchPublishedVideos(Integer categoryId,
                                                                 String keyword,
                                                                 String orderBy,
                                                                 String sort,
                                                                 int page,
                                                                 int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Specification<Video> spec = buildPublishedSpec(categoryId, keyword);
        Sort sortObj = resolveSort(orderBy, sort);
        Page<Video> result = videoRepository.findAll(spec, PageRequest.of(safePage - 1, safeSize, sortObj));
        List<PxbLegacyVideoRow> rows = result.getContent().stream().map(this::toRow).toList();
        return PageResponse.of(rows, result.getTotalElements(), safePage, safeSize);
    }

    @Override
    public List<PxbLegacyVideoRow> findPublishedVideosByIds(Collection<Integer> videoIds) {
        if (videoIds == null || videoIds.isEmpty()) {
            return List.of();
        }
        List<Integer> ids = videoIds.stream().filter(Objects::nonNull).filter(id -> id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Integer, Video> byId = videoRepository.findAllById(ids).stream()
                .filter(v -> Objects.equals(v.getStatus(), VideoStatus.PUBLISHED.getValue()))
                .collect(Collectors.toMap(Video::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));
        List<PxbLegacyVideoRow> rows = new ArrayList<>();
        for (Integer id : ids) {
            Video video = byId.get(id);
            if (video != null) {
                rows.add(toRow(video));
            }
        }
        return rows;
    }

    @Override
    public Map<Integer, Integer> findPurchasedVideoIdMap(Integer userId,
                                                         Integer categoryId,
                                                         String keyword,
                                                         Integer pxbRootId) {
        if (userId == null || userId <= 0) {
            return Map.of();
        }
        List<VideoEnrollment> enrollments = findActiveEnrollments(userId, pxbRootId);
        if (enrollments.isEmpty()) {
            return Map.of();
        }
        Set<Integer> videoIds = enrollments.stream().map(VideoEnrollment::getVideoId).collect(Collectors.toSet());
        Map<Integer, Video> videos = videoRepository.findAllById(videoIds).stream()
                .collect(Collectors.toMap(Video::getId, Function.identity()));
        Map<Integer, Integer> result = new LinkedHashMap<>();
        for (VideoEnrollment enrollment : enrollments) {
            Video video = videos.get(enrollment.getVideoId());
            if (video == null) {
                continue;
            }
            if (!matchesCategory(video, categoryId)) {
                continue;
            }
            if (!matchesKeyword(video, keyword)) {
                continue;
            }
            result.put(video.getId(), video.getId());
        }
        return result;
    }

    @Override
    public Map<Integer, PxbLegacyPurchaseInfo> findPurchaseInfoByVideoIds(Integer userId,
                                                                         Collection<Integer> videoIds,
                                                                         Integer pxbRootId) {
        if (userId == null || userId <= 0 || videoIds == null || videoIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = videoIds.stream().filter(Objects::nonNull).filter(id -> id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Integer, Order> orderById = loadPaidOrdersForUser(userId, pxbRootId);
        LocalDateTime now = LocalDateTime.now();
        List<VideoEnrollment> enrollments = videoEnrollmentRepository.findByUserIdAndVideoIdIn(userId, ids);
        Map<Integer, PxbLegacyPurchaseInfo> result = new LinkedHashMap<>();
        for (VideoEnrollment enrollment : enrollments) {
            if (!isActiveEnrollment(enrollment, now)) {
                continue;
            }
            if (!enrollmentMatchesPxbRoot(enrollment, orderById, pxbRootId)) {
                continue;
            }
            result.put(enrollment.getVideoId(), toPurchaseInfo(enrollment));
        }

        Set<Integer> missing = new LinkedHashSet<>(ids);
        missing.removeAll(result.keySet());
        if (!missing.isEmpty()) {
            fillPurchaseFromPaidOrders(missing, orderById, pxbRootId, now, result);
        }
        return result;
    }

    private static PxbLegacyPurchaseInfo toPurchaseInfo(VideoEnrollment enrollment) {
        return PxbLegacyPurchaseInfo.builder()
                .videoId(enrollment.getVideoId())
                .enrolledAt(enrollment.getEnrolledAt())
                .expiredAt(enrollment.getExpiredAt())
                .status(enrollment.getStatus())
                .build();
    }

    private static boolean isActiveEnrollment(VideoEnrollment enrollment, LocalDateTime now) {
        if (!Objects.equals(enrollment.getStatus(), 1)) {
            return false;
        }
        return enrollment.getExpiredAt() == null || enrollment.getExpiredAt().isAfter(now);
    }

    /**
     * 有效 enrollment 优先信任；若关联订单可查则校验 pxb_root，订单缺失时不丢弃（对齐老站 order_detail 宽语义）。
     */
    private boolean enrollmentMatchesPxbRoot(VideoEnrollment enrollment,
                                             Map<Integer, Order> orderById,
                                             Integer pxbRootId) {
        if (enrollment.getOrderId() == null || enrollment.getOrderId() <= 0) {
            return true;
        }
        Order order = orderById.get(enrollment.getOrderId());
        if (order == null) {
            return true;
        }
        return matchesPxbRoot(order, pxbRootId);
    }

    /** 从已支付订单明细补全购买状态（老站 getCoursesByIds 的 order_detail JOIN 语义）。 */
    private void fillPurchaseFromPaidOrders(Set<Integer> targetVideoIds,
                                            Map<Integer, Order> orderById,
                                            Integer pxbRootId,
                                            LocalDateTime now,
                                            Map<Integer, PxbLegacyPurchaseInfo> result) {
        for (Order order : orderById.values()) {
            if (!matchesPxbRoot(order, pxbRootId)) {
                continue;
            }
            if (order.getValidUntil() != null && !order.getValidUntil().isAfter(now)) {
                continue;
            }
            LocalDateTime enrolledAt = order.getValidFrom() != null ? order.getValidFrom() : order.getPaidAt();
            LocalDateTime expiredAt = order.getValidUntil();
            for (OrderItem item : orderItemRepository.findByOrderId(order.getId())) {
                if (item.getProductType() == ProductType.VIDEO_COURSE) {
                    tryAddPurchaseFromOrder(result, targetVideoIds, item.getProductId(), enrolledAt, expiredAt);
                } else if (item.getProductType() == ProductType.VIDEO_PACKAGE) {
                    videoPackageGroupRepository.findById(item.getProductId()).ifPresent(group ->
                            PxbLegacyPackageVideoResolver.resolvePublishedVideoIds(
                                    videoPackageRelationRepository,
                                    group.getPackageId(),
                                    group.getTopicId() != null ? group.getTopicId() : 0,
                                    group.getParentId() != null ? group.getParentId() : 0)
                                    .forEach(videoId -> tryAddPurchaseFromOrder(
                                            result, targetVideoIds, videoId, enrolledAt, expiredAt)));
                }
            }
        }
    }

    private static void tryAddPurchaseFromOrder(Map<Integer, PxbLegacyPurchaseInfo> result,
                                                Set<Integer> targetVideoIds,
                                                Integer videoId,
                                                LocalDateTime enrolledAt,
                                                LocalDateTime expiredAt) {
        if (videoId == null || videoId <= 0 || !targetVideoIds.contains(videoId) || result.containsKey(videoId)) {
            return;
        }
        result.put(videoId, PxbLegacyPurchaseInfo.builder()
                .videoId(videoId)
                .enrolledAt(enrolledAt)
                .expiredAt(expiredAt)
                .status(1)
                .build());
    }

    @Override
    public Map<Integer, List<Map<String, Object>>> findLegacySeriesByVideoIds(Collection<Integer> videoIds) {
        if (videoIds == null || videoIds.isEmpty()) {
            return Map.of();
        }
        List<Integer> ids = videoIds.stream().filter(Objects::nonNull).filter(id -> id > 0).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Integer, Video> videosById = videoRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Video::getId, Function.identity(), (a, b) -> a));
        Map<Integer, List<Map<String, Object>>> result = new LinkedHashMap<>();
        for (Integer videoId : ids) {
            Video video = videosById.get(videoId);
            if (video == null) {
                continue;
            }
            List<VideoChapter> chapters = videoChapterRepository.findByVideoIdOrderBySortOrderAsc(videoId);
            if (!isMultiEpisodeVideo(video, chapters)) {
                continue;
            }
            List<VideoSeries> seriesHeaders = videoSeriesRepository.findByVideoIdOrderBySortOrderAsc(videoId);
            result.put(videoId, buildLegacySeriesEntries(video, chapters, seriesHeaders));
        }
        return result;
    }

    private static boolean isMultiEpisodeVideo(Video video, List<VideoChapter> chapters) {
        return chapters.size() > 1
                || (video.getTotalEpisodes() != null && video.getTotalEpisodes() > 1);
    }

    /**
     * 对齐老站 coursesPrehandle：series 为索引数组，types=1 可播放分集，types=2 章节分割标题。
     */
    private List<Map<String, Object>> buildLegacySeriesEntries(Video video,
                                                                List<VideoChapter> chapters,
                                                                List<VideoSeries> seriesHeaders) {
        Map<Integer, VideoSeries> headerById = seriesHeaders.stream()
                .collect(Collectors.toMap(VideoSeries::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));
        Set<Integer> emittedHeaders = new HashSet<>();
        List<Map<String, Object>> entries = new ArrayList<>();

        for (VideoChapter chapter : chapters) {
            Integer seriesId = chapter.getSeriesId();
            if (seriesId != null && seriesId > 0 && headerById.containsKey(seriesId) && emittedHeaders.add(seriesId)) {
                entries.add(buildLegacySeriesHeaderRow(video.getId(), headerById.get(seriesId)));
            }
            entries.add(buildLegacySeriesEpisodeRow(video, chapter));
        }

        if (entries.isEmpty() && !chapters.isEmpty()) {
            for (VideoChapter chapter : chapters) {
                entries.add(buildLegacySeriesEpisodeRow(video, chapter));
            }
        }
        return entries;
    }

    private Map<String, Object> buildLegacySeriesEpisodeRow(Video video, VideoChapter chapter) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", chapter.getId());
        item.put("video_id", video.getId());
        item.put("title", chapter.getTitle());
        item.put("v_type", inferLegacyVType(chapter.getVideoUrl()));
        item.put("upload_target", "");
        item.put("sortorder", chapter.getSortOrder() != null ? chapter.getSortOrder() : 0);
        item.put("types", 1);
        item.put("online_size", chapter.getFileSize() != null ? chapter.getFileSize() : 0);
        item.put("url", "vid=" + video.getId() + "&child=" + chapter.getId());
        return item;
    }

    private static Map<String, Object> buildLegacySeriesHeaderRow(Integer videoId, VideoSeries header) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", header.getId());
        item.put("video_id", videoId);
        item.put("title", header.getTitle());
        item.put("v_type", 0);
        item.put("upload_target", "");
        item.put("sortorder", header.getSortOrder() != null ? header.getSortOrder() : 0);
        item.put("types", 2);
        item.put("online_size", 0);
        item.put("url", "");
        return item;
    }

    @Override
    public List<PxbLegacyVideoRow> listVideoAds(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 24);
        Pageable pageable = PageRequest.of(0, safeLimit);
        List<Video> videos = videoRepository.findLegacyFeaturedVideos(pageable);
        if (videos.isEmpty()) {
            videos = videoRepository.findLegacyPublishedVideos(pageable);
        }
        return videos.stream().map(this::toRow).toList();
    }

    @Override
    public List<Integer> findActivePurchasedVideoIds(Integer userId, Integer pxbRootId) {
        if (userId == null || userId <= 0) {
            return List.of();
        }
        return findActiveEnrollments(userId, pxbRootId).stream()
                .map(VideoEnrollment::getVideoId)
                .distinct()
                .toList();
    }

    @Override
    public Map<String, Object> buildVideoDetailMessage(Integer userId, Integer videoId, Integer pxbRootId) {
        Map<String, Object> msg = new LinkedHashMap<>();
        if (userId == null || userId <= 0 || videoId == null || videoId <= 0) {
            return msg;
        }
        Video video = videoRepository.findById(videoId)
                .filter(v -> Objects.equals(v.getStatus(), VideoStatus.PUBLISHED.getValue()))
                .orElse(null);
        if (video == null) {
            return msg;
        }

        Map<Integer, PxbLegacyPurchaseInfo> purchases = findPurchaseInfoByVideoIds(
                userId, List.of(videoId), pxbRootId);
        PxbLegacyPurchaseInfo purchase = purchases.get(videoId);
        Map<String, Object> buyStatus = buildBuyStatusMap(purchase);
        if (video.getPrice() != null && video.getPrice().signum() == 0) {
            buyStatus = new LinkedHashMap<>(Map.of("buystatus", 1));
        }
        msg.put("buy_status", buyStatus);
        msg.put("video", buildLegacyVideoDetailMap(video, purchase));
        return msg;
    }

    @Override
    public Map<String, Object> resolveMobilePlayback(Integer userId,
                                                       Integer videoId,
                                                       Integer chapterId,
                                                       Integer pxbRootId) {
        Video video = videoRepository.findById(videoId)
                .filter(v -> Objects.equals(v.getStatus(), VideoStatus.PUBLISHED.getValue()))
                .orElse(null);
        if (video == null) {
            return Map.of();
        }
        if (!canPlayVideo(userId, video, pxbRootId)) {
            return Map.of();
        }

        VideoChapter chapter = resolveChapter(video, chapterId);
        String playUrl = chapter != null && StringUtils.hasText(chapter.getVideoUrl())
                ? chapter.getVideoUrl() : video.getVideoUrl();
        if (!StringUtils.hasText(playUrl)) {
            playUrl = buildLegacyVideoUrl(video);
        }
        String poster = chapter != null && StringUtils.hasText(chapter.getCoverUrl())
                ? chapter.getCoverUrl() : video.getCoverUrl();
        int vType = inferLegacyVType(playUrl);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("video_url", playUrl);
        payload.put("poster", poster != null ? poster : "");
        payload.put("online", false);
        payload.put("size", chapter != null && chapter.getFileSize() != null ? chapter.getFileSize() : 0L);
        payload.put("v_type", vType);
        return payload;
    }

    @Override
    public int resolvePlaybackConcurrencyLimit(Integer userId, Integer videoId) {
        if (userId == null || userId <= 0 || videoId == null || videoId <= 0) {
            return 0;
        }
        Map<Integer, Order> paidOrders = loadPaidOrdersForUser(userId, null);
        int max = 0;
        LocalDateTime now = LocalDateTime.now();
        for (Order order : paidOrders.values()) {
            if (order.getValidUntil() != null && !order.getValidUntil().isAfter(now)) {
                continue;
            }
            boolean coversVideo = videoEnrollmentRepository.findByUserIdAndVideoIdIn(userId, List.of(videoId))
                    .stream()
                    .anyMatch(e -> Objects.equals(e.getOrderId(), order.getId())
                            && Objects.equals(e.getStatus(), 1));
            if (coversVideo && order.getConcurrency() != null && order.getConcurrency() > max) {
                max = order.getConcurrency();
            }
        }
        return max >= 100000 ? 0 : max;
    }

    private boolean canPlayVideo(Integer userId, Video video, Integer pxbRootId) {
        if (video.getPrice() == null || video.getPrice().signum() == 0
                || (video.getIsFree() != null && video.getIsFree() == 1)) {
            return true;
        }
        if (userId == null || userId <= 0) {
            return false;
        }
        Map<Integer, PxbLegacyPurchaseInfo> purchases = findPurchaseInfoByVideoIds(
                userId, List.of(video.getId()), pxbRootId);
        return resolveBuyStatus(purchases.get(video.getId())) > 0;
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

    private Map<String, Object> buildBuyStatusMap(PxbLegacyPurchaseInfo purchase) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("buystatus", resolveBuyStatus(purchase));
        map.put("starttime", toEpochSeconds(purchase != null ? purchase.getEnrolledAt() : null));
        map.put("endtime", toEpochSeconds(purchase != null ? purchase.getExpiredAt() : null));
        return map;
    }

    private Map<String, Object> buildLegacyVideoDetailMap(Video video, PxbLegacyPurchaseInfo purchase) {
        List<VideoChapter> chapters = videoChapterRepository.findByVideoIdOrderBySortOrderAsc(video.getId());
        boolean isSeries = chapters.size() > 1
                || (video.getTotalEpisodes() != null && video.getTotalEpisodes() > 1);

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", video.getId());
        map.put("uid", video.getPublisherId());
        map.put("roleid", 0);
        map.put("groupid", 0);
        map.put("title", video.getTitle());
        map.put("url", buildLegacyVideoUrl(video));
        map.put("pic", video.getCoverUrl());
        map.put("duration_temp", video.getDuration());
        map.put("duration_second", formatDurationSeconds(video.getDuration()));
        map.put("duration", formatDurationHuman(video.getDuration()));
        map.put("intro", video.getIntro() != null ? video.getIntro() : "");
        map.put("v_type", inferLegacyVType(video.getVideoUrl()));
        map.put("types", isSeries ? 1 : 0);
        map.put("video_price", video.getPrice());
        map.put("teacher", video.getTeacherName() != null ? video.getTeacherName().replace(" ", "") : "");
        map.put("score", video.getScore());
        map.put("online_size", 0);
        map.put("medio_type", 0);
        if (isSeries) {
            map.put("series_title", video.getTitle());
            map.put("seriesList", buildSeriesListMap(video, chapters));
        }
        return map;
    }

    private Map<String, Object> buildSeriesListMap(Video video, List<VideoChapter> chapters) {
        Map<String, Object> seriesList = new LinkedHashMap<>();
        for (Map<String, Object> entry : buildLegacySeriesEntries(
                video, chapters, videoSeriesRepository.findByVideoIdOrderBySortOrderAsc(video.getId()))) {
            Object id = entry.get("id");
            if (id != null) {
                seriesList.put(String.valueOf(id), entry);
            }
        }
        return seriesList;
    }

    private static String formatDurationSeconds(Integer seconds) {
        if (seconds == null || seconds <= 0) {
            return "00:00:00";
        }
        int s = seconds;
        int h = s / 3600;
        int m = (s % 3600) / 60;
        int sec = s % 60;
        return String.format("%02d:%02d:%02d", h, m, sec);
    }

    private static String formatDurationHuman(Integer seconds) {
        if (seconds == null || seconds <= 0) {
            return "";
        }
        int s = seconds;
        int h = s / 3600;
        int m = (s % 3600) / 60;
        if (h > 0) {
            return h + "小时" + (m > 0 ? m + "分钟" : "");
        }
        return m > 0 ? m + "分钟" : s + "秒";
    }

    private List<VideoEnrollment> findActiveEnrollments(Integer userId, Integer pxbRootId) {
        Map<Integer, Order> paidOrders = loadPaidOrdersForUser(userId, pxbRootId);
        if (paidOrders.isEmpty()) {
            return List.of();
        }
        LocalDateTime now = LocalDateTime.now();
        List<VideoEnrollment> result = new ArrayList<>();
        for (Integer orderId : paidOrders.keySet()) {
            for (VideoEnrollment enrollment : videoEnrollmentRepository.findByOrderId(orderId)) {
                if (!Objects.equals(enrollment.getStatus(), 1)) {
                    continue;
                }
                if (enrollment.getExpiredAt() != null && !enrollment.getExpiredAt().isAfter(now)) {
                    continue;
                }
                result.add(enrollment);
            }
        }
        return result;
    }

    private Map<Integer, Order> loadPaidOrdersForUser(Integer userId, Integer pxbRootId) {
        List<Order> orders = orderRepository.findByUserIdAndStatus(userId, OrderStatus.PAID.getValue());
        return orders.stream()
                .filter(o -> matchesPxbRoot(o, pxbRootId))
                .collect(Collectors.toMap(Order::getId, Function.identity()));
    }

    private boolean matchesPxbRoot(Order order, Integer pxbRootId) {
        if (pxbRootId == null || pxbRootId <= 0) {
            return true;
        }
        Integer root = order.getPxbRootId() != null ? order.getPxbRootId() : 0;
        return root == 0 || root.equals(pxbRootId);
    }

    private Specification<Video> buildPublishedSpec(Integer categoryId, String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), VideoStatus.PUBLISHED.getValue()));
            if (categoryId != null && categoryId > 0) {
                Predicate cat = cb.or(
                        cb.equal(root.get("categoryId"), categoryId),
                        cb.equal(root.get("subCategoryId"), categoryId)
                );
                predicates.add(cat);
            }
            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), pattern),
                        cb.like(root.get("teacherName"), pattern)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Sort resolveSort(String orderBy, String sort) {
        String field = switch (orderBy != null ? orderBy.trim().toLowerCase() : "id") {
            case "price", "video_price" -> "price";
            case "score" -> "score";
            case "title" -> "title";
            default -> "id";
        };
        Sort.Direction direction = "asc".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, field);
    }

    private PxbLegacyVideoRow toRow(Video video) {
        String categoryName = null;
        if (video.getCategoryId() != null && video.getCategoryId() > 0) {
            categoryName = categoryService.getNameMap(List.of(video.getCategoryId()))
                    .get(video.getCategoryId());
        }
        return PxbLegacyVideoRow.builder()
                .id(video.getId())
                .title(video.getTitle())
                .price(video.getPrice())
                .teacherName(video.getTeacherName())
                .coverUrl(video.getCoverUrl())
                .videoUrl(buildLegacyVideoUrl(video))
                .vType(inferLegacyVType(video.getVideoUrl()))
                .score(video.getScore())
                .duration(video.getDuration())
                .categoryId(video.getCategoryId())
                .categoryName(categoryName)
                .totalEpisodes(video.getTotalEpisodes())
                .build();
    }

    static String buildLegacyVideoUrl(Video video) {
        if (StringUtils.hasText(video.getVideoUrl())) {
            return video.getVideoUrl();
        }
        return "vid=" + video.getId() + "&child=0";
    }

    static int inferLegacyVType(String videoUrl) {
        if (!StringUtils.hasText(videoUrl)) {
            return 1;
        }
        String lower = videoUrl.toLowerCase();
        if (lower.contains("kuanxue.com")) {
            return 9;
        }
        if (lower.contains("witsharer.com") || lower.contains("kuaike")) {
            return 10;
        }
        if (lower.contains("eceibs.com")) {
            return 11;
        }
        return 1;
    }

    private boolean matchesCategory(Video video, Integer categoryId) {
        if (categoryId == null || categoryId <= 0) {
            return true;
        }
        return Objects.equals(video.getCategoryId(), categoryId)
                || Objects.equals(video.getSubCategoryId(), categoryId);
    }

    private boolean matchesKeyword(Video video, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        String kw = keyword.trim();
        return (video.getTitle() != null && video.getTitle().contains(kw))
                || (video.getTeacherName() != null && video.getTeacherName().contains(kw));
    }

    /** 供 legacy 层计算 buystatus：0 未购 / 1 已购 / -1 过期 / -2 即将过期 */
    public static int resolveBuyStatus(PxbLegacyPurchaseInfo info) {
        if (info == null || !Objects.equals(info.getStatus(), 1)) {
            return 0;
        }
        LocalDateTime expiredAt = info.getExpiredAt();
        if (expiredAt != null && expiredAt.isBefore(LocalDateTime.now())) {
            return -1;
        }
        if (expiredAt != null && expiredAt.isBefore(LocalDateTime.now().plusDays(SOON_EXPIRE_DAYS))) {
            return -2;
        }
        return 1;
    }

    public static long toEpochSeconds(LocalDateTime time) {
        return time == null ? 0L : time.atZone(java.time.ZoneId.of("Asia/Shanghai")).toEpochSecond();
    }
}
