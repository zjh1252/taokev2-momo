package com.taoke.admin.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.admin.entity.CrawledCourse;
import com.taoke.admin.repository.CrawledCourseRepository;
import com.taoke.common.service.RegionService;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.CoursePlanDTO;
import com.taoke.course.entity.Course;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * 爬取课程跨源去重判断。
 */
@Service
@RequiredArgsConstructor
public class CourseDuplicateService {

    public static final String TARGET_COURSE = "COURSE";
    public static final String TARGET_CRAWLED_COURSE = "CRAWLED_COURSE";

    private static final int STATUS_NO_DUPLICATE = 1;
    private static final int STATUS_SUSPECTED_DUPLICATE = 2;
    private static final Pattern TITLE_SUFFIX = Pattern.compile("(课程|培训班|培训课|培训|公开课|内训课|内训|实战班|研修班|高级研修班)$");
    private static final Set<String> MUNICIPALITIES = Set.of("北京", "上海", "天津", "重庆");

    private final CrawledCourseRepository crawledCourseRepository;
    private final CourseService courseService;
    private final RegionService regionService;
    private final ObjectMapper objectMapper;

    public DuplicateCheckResult checkAndApply(CrawledCourse course, CheckScene scene) {
        DuplicateCheckResult result = check(course, scene);
        apply(course, result);
        return result;
    }

    public DuplicateCheckResult check(CrawledCourse course, CheckScene scene) {
        CourseFingerprint current = CourseFingerprint.fromCrawled(course, parsePlans(course.getPlansJson()), regionService);
        if (current.normalizedTitle().isBlank()) {
            return DuplicateCheckResult.noDuplicate();
        }

        DuplicateCheckResult official = findOfficialDuplicate(current);
        if (official.duplicate()) {
            return official.withBlocking(scene == CheckScene.BEFORE_IMPORT && official.score() >= 90);
        }

        DuplicateCheckResult crawled = findCrawledDuplicate(course, current);
        if (crawled.duplicate()) {
            return crawled.withBlocking(false);
        }

        return DuplicateCheckResult.noDuplicate();
    }

    private void apply(CrawledCourse course, DuplicateCheckResult result) {
        course.setDedupStatus(result.status());
        course.setDedupTargetType(result.targetType());
        course.setDedupTargetId(result.targetId());
        course.setDedupMatchType(result.matchType());
        course.setDedupScore(result.score());
        course.setDedupReason(result.reason());
        course.setDedupCheckedAt(LocalDateTime.now());
        course.setDedupCourseId(TARGET_COURSE.equals(result.targetType()) ? result.targetId() : null);
    }

    private DuplicateCheckResult findOfficialDuplicate(CourseFingerprint current) {
        String keyword = queryKeyword(current.rawTitle());
        if (keyword.isBlank()) {
            return DuplicateCheckResult.noDuplicate();
        }
        List<Course> candidates = courseService.searchForAdmin(
                        keyword,
                        null,
                        current.type(),
                        PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "id")))
                .getContent();

        DuplicateCheckResult best = DuplicateCheckResult.noDuplicate();
        for (Course candidate : candidates) {
            if (candidate == null || candidate.getId() == null) {
                continue;
            }
            CourseDetailVO detail;
            try {
                detail = courseService.getDetailForAdmin(candidate.getId());
            } catch (Exception ignored) {
                continue;
            }
            CourseFingerprint other = CourseFingerprint.fromOfficial(detail, regionService);
            DuplicateCheckResult matched = match(current, other, TARGET_COURSE, candidate.getId());
            if (matched.score() > best.score()) {
                best = matched;
            }
        }
        return best;
    }

    private DuplicateCheckResult findCrawledDuplicate(CrawledCourse self, CourseFingerprint current) {
        List<CrawledCourse> candidates = crawledCourseRepository.findDedupCandidates(
                current.type(),
                List.of(0, 3),
                self.getId(),
                PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "id")));

        DuplicateCheckResult best = DuplicateCheckResult.noDuplicate();
        for (CrawledCourse candidate : candidates) {
            if (candidate == null || candidate.getId() == null) {
                continue;
            }
            if (Objects.equals(self.getSource(), candidate.getSource())
                    && Objects.equals(self.getSourceCourseId(), candidate.getSourceCourseId())) {
                continue;
            }
            CourseFingerprint other = CourseFingerprint.fromCrawled(candidate, parsePlans(candidate.getPlansJson()), regionService);
            String targetType = candidate.getReviewStatus() != null && candidate.getReviewStatus() == 3
                    && candidate.getImportedCourseId() != null ? TARGET_COURSE : TARGET_CRAWLED_COURSE;
            Integer targetId = TARGET_COURSE.equals(targetType) ? candidate.getImportedCourseId() : candidate.getId();
            DuplicateCheckResult matched = match(current, other, targetType, targetId);
            if (matched.score() > best.score()) {
                best = matched;
            }
        }
        return best;
    }

    private DuplicateCheckResult match(CourseFingerprint current, CourseFingerprint other, String targetType, Integer targetId) {
        if (other == null || !Objects.equals(current.type(), other.type())) {
            return DuplicateCheckResult.noDuplicate();
        }
        if (!Objects.equals(current.normalizedTitle(), other.normalizedTitle())) {
            return DuplicateCheckResult.noDuplicate();
        }
        return switch (current.type()) {
            case "OPEN_OFFLINE" -> matchOffline(current, other, targetType, targetId);
            case "OPEN_ONLINE" -> matchOnline(current, other, targetType, targetId);
            case "INTERNAL" -> matchInternal(current, other, targetType, targetId);
            default -> DuplicateCheckResult.noDuplicate();
        };
    }

    private DuplicateCheckResult matchOffline(CourseFingerprint current, CourseFingerprint other, String targetType, Integer targetId) {
        for (PlanFingerprint left : current.plans()) {
            for (PlanFingerprint right : other.plans()) {
                if (left.startDate() != null
                        && Objects.equals(left.startDate(), right.startDate())
                        && !left.normalizedCity().isBlank()
                        && Objects.equals(left.normalizedCity(), right.normalizedCity())) {
                    String reason = "%s #%d 与当前线下公开课标题、城市、开课日期一致：%s / %s / %s"
                            .formatted(targetLabel(targetType), targetId, current.rawTitle(), left.displayCity(), left.startDate());
                    return DuplicateCheckResult.duplicate(targetType, targetId, "OFFLINE_TITLE_CITY_DATE", 90, reason);
                }
            }
        }
        return DuplicateCheckResult.noDuplicate();
    }

    private DuplicateCheckResult matchOnline(CourseFingerprint current, CourseFingerprint other, String targetType, Integer targetId) {
        DuplicateCheckResult degraded = DuplicateCheckResult.noDuplicate();
        for (PlanFingerprint left : current.plans()) {
            for (PlanFingerprint right : other.plans()) {
                if (left.startDate() == null || !Objects.equals(left.startDate(), right.startDate())) {
                    continue;
                }
                if (!left.normalizedOnlineUrl().isBlank()
                        && Objects.equals(left.normalizedOnlineUrl(), right.normalizedOnlineUrl())) {
                    String reason = "%s #%d 与当前线上公开课标题、线上入口、开课日期一致：%s / %s"
                            .formatted(targetLabel(targetType), targetId, current.rawTitle(), left.startDate());
                    return DuplicateCheckResult.duplicate(targetType, targetId, "ONLINE_TITLE_URL_DATE", 90, reason);
                }
                if (left.normalizedOnlineUrl().isBlank() || right.normalizedOnlineUrl().isBlank()) {
                    String reason = "%s #%d 与当前线上公开课标题、开课日期一致，但线上入口缺失或不一致：%s / %s"
                            .formatted(targetLabel(targetType), targetId, current.rawTitle(), left.startDate());
                    degraded = DuplicateCheckResult.duplicate(targetType, targetId, "ONLINE_TITLE_DATE", 75, reason);
                }
            }
        }
        return degraded;
    }

    private DuplicateCheckResult matchInternal(CourseFingerprint current, CourseFingerprint other, String targetType, Integer targetId) {
        if (current.normalizedTrainer().isBlank()
                || !Objects.equals(current.normalizedTrainer(), other.normalizedTrainer())) {
            return DuplicateCheckResult.noDuplicate();
        }
        boolean sameDurationDays = current.durationDays() != null && current.durationDays() > 0
                && Objects.equals(current.durationDays(), other.durationDays());
        boolean sameHours = current.totalHours() != null && other.totalHours() != null
                && current.totalHours().compareTo(BigDecimal.ZERO) > 0
                && current.totalHours().compareTo(other.totalHours()) == 0;
        if (!sameDurationDays && !sameHours) {
            return DuplicateCheckResult.noDuplicate();
        }
        String reason = "%s #%d 与当前内训课标题、讲师、时长一致：%s / %s"
                .formatted(targetLabel(targetType), targetId, current.rawTitle(), current.rawTrainer());
        return DuplicateCheckResult.duplicate(targetType, targetId, "INTERNAL_TITLE_TRAINER_DURATION", 80, reason);
    }

    private String targetLabel(String targetType) {
        return TARGET_COURSE.equals(targetType) ? "正式课程" : "待审核爬取课程";
    }

    private List<Map<String, Object>> parsePlans(String plansJson) {
        if (plansJson == null || plansJson.isBlank()) {
            return List.of();
        }
        try {
            List<Map<String, Object>> result = objectMapper.readValue(plansJson, new TypeReference<>() {});
            return result == null ? List.of() : result;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private String queryKeyword(String title) {
        String text = title == null ? "" : title.trim();
        if (text.length() <= 30) {
            return text;
        }
        return text.substring(0, 30);
    }

    static String normalizeTitle(String value) {
        String text = normalizeBasic(value);
        if (text.isBlank()) {
            return "";
        }
        String previous;
        do {
            previous = text;
            text = TITLE_SUFFIX.matcher(text).replaceAll("");
        } while (!Objects.equals(previous, text));
        return text;
    }

    static String normalizeCity(String value) {
        String text = normalizeBasic(value);
        if (text.isBlank()) {
            return "";
        }
        for (String municipality : MUNICIPALITIES) {
            if (text.contains(municipality)) {
                return municipality;
            }
        }
        if (text.endsWith("市")) {
            text = text.substring(0, text.length() - 1);
        }
        return text;
    }

    static String normalizeTrainer(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String[] parts = value.split("[,，、/|和及&+]");
        List<String> normalized = new ArrayList<>();
        for (String part : parts) {
            String name = normalizeBasic(part).replaceAll("(老师|讲师|导师|教授|博士)$", "");
            if (!name.isBlank()) {
                normalized.add(name);
            }
        }
        normalized.sort(Comparator.naturalOrder());
        return String.join("", normalized);
    }

    static String normalizeOnlineUrl(String value) {
        if (value == null || value.isBlank() || value.contains("在线课程")) {
            return "";
        }
        try {
            URI uri = URI.create(value.trim());
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            String path = uri.getPath() == null ? "" : uri.getPath();
            String query = uri.getQuery();
            String normalized = (scheme.isBlank() ? "" : scheme + "://") + host + path;
            if (query != null && !query.isBlank() && !query.toLowerCase(Locale.ROOT).startsWith("utm_")) {
                normalized += "?" + query;
            }
            return normalized.replaceAll("/+$", "");
        } catch (Exception ignored) {
            return value.trim().toLowerCase(Locale.ROOT).replaceAll("/+$", "");
        }
    }

    static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String text = value.trim().replace('T', ' ');
        for (String part : text.split("\\s+")) {
            try {
                return LocalDate.parse(part);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private static String normalizeBasic(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder converted = new StringBuilder();
        for (char ch : value.trim().toCharArray()) {
            if (ch == 12288) {
                converted.append(' ');
            } else if (ch >= 65281 && ch <= 65374) {
                converted.append((char) (ch - 65248));
            } else {
                converted.append(ch);
            }
        }
        return converted.toString()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[\\s\\p{Punct}，。！？；：、“”‘’（）【】《》]+", "")
                .trim();
    }

    private static String mapString(Map<String, Object> raw, String... keys) {
        if (raw == null) {
            return "";
        }
        for (String key : keys) {
            Object value = raw.get(key);
            if (value != null) {
                String text = value.toString().trim();
                if (!text.isBlank()) {
                    return text;
                }
            }
        }
        return "";
    }

    public enum CheckScene {
        CALLBACK_SAVE,
        REVIEW_SAVE,
        BEFORE_IMPORT
    }

    public record DuplicateCheckResult(
            boolean duplicate,
            int status,
            String targetType,
            Integer targetId,
            String matchType,
            int score,
            String reason,
            boolean blocking
    ) {
        static DuplicateCheckResult noDuplicate() {
            return new DuplicateCheckResult(false, STATUS_NO_DUPLICATE, null, null, null, 0, null, false);
        }

        static DuplicateCheckResult duplicate(String targetType, Integer targetId, String matchType, int score, String reason) {
            return new DuplicateCheckResult(true, STATUS_SUSPECTED_DUPLICATE, targetType, targetId, matchType, score, reason, false);
        }

        DuplicateCheckResult withBlocking(boolean blocking) {
            return new DuplicateCheckResult(duplicate, status, targetType, targetId, matchType, score, reason, blocking);
        }
    }

    private record CourseFingerprint(
            String type,
            String rawTitle,
            String normalizedTitle,
            String rawTrainer,
            String normalizedTrainer,
            Integer durationDays,
            BigDecimal totalHours,
            List<PlanFingerprint> plans
    ) {
        static CourseFingerprint fromCrawled(CrawledCourse course, List<Map<String, Object>> rawPlans, RegionService regionService) {
            List<PlanFingerprint> plans = rawPlans.stream()
                    .map(raw -> PlanFingerprint.fromRaw(raw, regionService))
                    .toList();
            return new CourseFingerprint(
                    normalizeType(course.getType()),
                    safe(course.getTitle()),
                    normalizeTitle(course.getTitle()),
                    safe(course.getTrainerNameRaw()),
                    normalizeTrainer(course.getTrainerNameRaw()),
                    course.getDurationDays(),
                    course.getTotalHours(),
                    plans);
        }

        static CourseFingerprint fromOfficial(CourseDetailVO course, RegionService regionService) {
            List<PlanFingerprint> plans = course.getPlans() == null ? List.of() : course.getPlans().stream()
                    .map(plan -> PlanFingerprint.fromOfficial(plan, regionService))
                    .toList();
            return new CourseFingerprint(
                    normalizeType(course.getType()),
                    safe(course.getTitle()),
                    normalizeTitle(course.getTitle()),
                    safe(course.getTrainerName()),
                    normalizeTrainer(course.getTrainerName()),
                    course.getDurationDays(),
                    course.getTotalHours(),
                    plans);
        }
    }

    private record PlanFingerprint(
            LocalDate startDate,
            String displayCity,
            String normalizedCity,
            String normalizedOnlineUrl
    ) {
        static PlanFingerprint fromRaw(Map<String, Object> raw, RegionService regionService) {
            LocalDate date = parseDate(mapString(raw, "start_date", "startDate", "start_time", "startTime", "date"));
            String city = firstPresent(
                    mapString(raw, "city"),
                    mapString(raw, "location"),
                    mapString(raw, "address"));
            Integer cityId = mapInteger(raw, "cityId", "city_id");
            if ((city == null || city.isBlank()) && cityId != null && cityId > 0) {
                city = regionService.getNameById(cityId);
            }
            String onlineUrl = firstPresent(
                    mapString(raw, "onlineUrl"),
                    mapString(raw, "online_url"),
                    mapString(raw, "signupUrl"),
                    mapString(raw, "signup_url"),
                    mapString(raw, "url"));
            return new PlanFingerprint(date, safe(city), normalizeCity(city), normalizeOnlineUrl(onlineUrl));
        }

        static PlanFingerprint fromOfficial(CoursePlanDTO plan, RegionService regionService) {
            LocalDate date = plan.getStartTime() == null ? null : plan.getStartTime().toLocalDate();
            String city = plan.getCityId() != null && plan.getCityId() > 0 ? regionService.getNameById(plan.getCityId()) : "";
            if (city.isBlank()) {
                city = plan.getAddress();
            }
            return new PlanFingerprint(date, safe(city), normalizeCity(city), normalizeOnlineUrl(plan.getOnlineUrl()));
        }
    }

    private static String normalizeType(String value) {
        if (value == null || value.isBlank()) {
            return "OPEN_OFFLINE";
        }
        String text = value.trim().toUpperCase(Locale.ROOT);
        return switch (text) {
            case "OPEN_ONLINE", "ONLINE" -> "OPEN_ONLINE";
            case "INTERNAL" -> "INTERNAL";
            default -> "OPEN_OFFLINE";
        };
    }

    private static String firstPresent(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private static Integer mapInteger(Map<String, Object> raw, String... keys) {
        String text = mapString(raw, keys);
        if (text.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
