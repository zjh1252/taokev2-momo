package com.taoke.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.admin.entity.CrawledCourse;
import com.taoke.admin.repository.CrawledCourseRepository;
import com.taoke.common.service.RegionService;
import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.dto.course.CoursePlanDTO;
import com.taoke.course.entity.Course;
import com.taoke.course.enums.CourseType;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CourseDuplicateServiceTest {

    private final CrawledCourseRepository crawledCourseRepository = mock(CrawledCourseRepository.class);
    private final CourseService courseService = mock(CourseService.class);
    private final RegionService regionService = mock(RegionService.class);
    private final CourseDuplicateService service = new CourseDuplicateService(
            crawledCourseRepository,
            courseService,
            regionService,
            new ObjectMapper());

    @Test
    void normalizesCoreFields() {
        assertThat(CourseDuplicateService.normalizeTitle("《AI 赋能销售管理》公开课")).isEqualTo("ai赋能销售管理");
        assertThat(CourseDuplicateService.normalizeCity("上海市")).isEqualTo("上海");
        assertThat(CourseDuplicateService.normalizeTrainer("张三老师、李四讲师")).isEqualTo("张三李四");
        assertThat(CourseDuplicateService.normalizeOnlineUrl("HTTPS://example.com/live/?id=1#top")).isEqualTo("https://example.com/live/?id=1");
        assertThat(CourseDuplicateService.parseDate("2026-08-12 09:00:00")).hasToString("2026-08-12");
    }

    @Test
    void offlineCourseMatchesOfficialCourseByTitleCityAndDate() {
        CrawledCourse current = crawledCourse("OPEN_OFFLINE", "AI 赋能销售管理", "张三");
        current.setPlansJson("""
                [{"startDate":"2026-08-12","city":"上海市","address":"上海市浦东新区"}]
                """);
        mockOfficialCandidates(officialDetail("OPEN_OFFLINE", "AI赋能销售管理", "张三",
                officialPlan("2026-08-12T09:00:00", 1, "", "")));
        when(regionService.getNameById(1)).thenReturn("上海");

        CourseDuplicateService.DuplicateCheckResult result = service.check(current, CourseDuplicateService.CheckScene.BEFORE_IMPORT);

        assertThat(result.duplicate()).isTrue();
        assertThat(result.targetType()).isEqualTo(CourseDuplicateService.TARGET_COURSE);
        assertThat(result.matchType()).isEqualTo("OFFLINE_TITLE_CITY_DATE");
        assertThat(result.score()).isEqualTo(90);
        assertThat(result.blocking()).isTrue();
    }

    @Test
    void offlineCourseWithDifferentDateDoesNotStrongMatch() {
        CrawledCourse current = crawledCourse("OPEN_OFFLINE", "AI 赋能销售管理", "张三");
        current.setPlansJson("""
                [{"startDate":"2026-08-12","city":"上海"}]
                """);
        mockOfficialCandidates(officialDetail("OPEN_OFFLINE", "AI赋能销售管理", "张三",
                officialPlan("2026-08-13T09:00:00", 1, "", "")));
        when(regionService.getNameById(1)).thenReturn("上海");

        CourseDuplicateService.DuplicateCheckResult result = service.check(current, CourseDuplicateService.CheckScene.BEFORE_IMPORT);

        assertThat(result.duplicate()).isFalse();
    }

    @Test
    void onlineCourseMatchesOfficialCourseByTitleUrlAndDate() {
        CrawledCourse current = crawledCourse("OPEN_ONLINE", "采购成本控制", "张三");
        current.setPlansJson("""
                [{"startDate":"2026-09-01","onlineUrl":"https://example.com/live?id=8"}]
                """);
        mockOfficialCandidates(officialDetail("OPEN_ONLINE", "采购成本控制课程", "张三",
                officialPlan("2026-09-01T19:00:00", 0, "", "https://example.com/live?id=8")));

        CourseDuplicateService.DuplicateCheckResult result = service.check(current, CourseDuplicateService.CheckScene.BEFORE_IMPORT);

        assertThat(result.duplicate()).isTrue();
        assertThat(result.matchType()).isEqualTo("ONLINE_TITLE_URL_DATE");
        assertThat(result.blocking()).isTrue();
    }

    @Test
    void onlineCourseWithoutUrlOnlyDowngradesToSuspected() {
        CrawledCourse current = crawledCourse("OPEN_ONLINE", "采购成本控制", "张三");
        current.setPlansJson("""
                [{"startDate":"2026-09-01"}]
                """);
        mockOfficialCandidates(officialDetail("OPEN_ONLINE", "采购成本控制课程", "张三",
                officialPlan("2026-09-01T19:00:00", 0, "", "https://example.com/live?id=8")));

        CourseDuplicateService.DuplicateCheckResult result = service.check(current, CourseDuplicateService.CheckScene.BEFORE_IMPORT);

        assertThat(result.duplicate()).isTrue();
        assertThat(result.matchType()).isEqualTo("ONLINE_TITLE_DATE");
        assertThat(result.score()).isEqualTo(75);
        assertThat(result.blocking()).isFalse();
    }

    @Test
    void internalCourseMatchesOfficialCourseByTitleTrainerAndDuration() {
        CrawledCourse current = crawledCourse("INTERNAL", "销售管理实战", "张三老师");
        current.setDurationDays(2);
        current.setTotalHours(BigDecimal.valueOf(12));
        mockOfficialCandidates(officialDetail("INTERNAL", "销售管理实战内训", "张三", null));

        CourseDuplicateService.DuplicateCheckResult result = service.check(current, CourseDuplicateService.CheckScene.BEFORE_IMPORT);

        assertThat(result.duplicate()).isTrue();
        assertThat(result.matchType()).isEqualTo("INTERNAL_TITLE_TRAINER_DURATION");
        assertThat(result.score()).isEqualTo(80);
        assertThat(result.blocking()).isFalse();
    }

    @Test
    void crawledCandidateIsMarkedAsReviewDuplicateButNotBlocking() {
        CrawledCourse current = crawledCourse("OPEN_OFFLINE", "项目管理实战", "张三");
        current.setId(100);
        current.setSource("source_a");
        current.setSourceCourseId("a-1");
        current.setPlansJson("""
                [{"startDate":"2026-10-01","city":"北京"}]
                """);
        when(courseService.searchForAdmin(anyString(), isNull(), eq("OPEN_OFFLINE"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        CrawledCourse other = crawledCourse("OPEN_OFFLINE", "项目管理实战课程", "张三");
        other.setId(200);
        other.setSource("source_b");
        other.setSourceCourseId("b-1");
        other.setReviewStatus(0);
        other.setPlansJson("""
                [{"startDate":"2026-10-01","city":"北京市"}]
                """);
        when(crawledCourseRepository.findDedupCandidates(eq("OPEN_OFFLINE"), anyCollection(), eq(100), any(Pageable.class)))
                .thenReturn(List.of(other));

        CourseDuplicateService.DuplicateCheckResult result = service.check(current, CourseDuplicateService.CheckScene.BEFORE_IMPORT);

        assertThat(result.duplicate()).isTrue();
        assertThat(result.targetType()).isEqualTo(CourseDuplicateService.TARGET_CRAWLED_COURSE);
        assertThat(result.targetId()).isEqualTo(200);
        assertThat(result.blocking()).isFalse();
    }

    private CrawledCourse crawledCourse(String type, String title, String trainer) {
        CrawledCourse course = new CrawledCourse();
        course.setType(type);
        course.setTitle(title);
        course.setTrainerNameRaw(trainer);
        course.setDurationDays(2);
        course.setTotalHours(BigDecimal.valueOf(12));
        return course;
    }

    private void mockOfficialCandidates(CourseDetailVO detail) {
        Course course = new Course();
        course.setId(detail.getId());
        course.setTitle(detail.getTitle());
        course.setType(CourseType.valueOf(detail.getType()));
        when(courseService.searchForAdmin(anyString(), isNull(), eq(detail.getType()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(course)));
        when(courseService.getDetailForAdmin(detail.getId())).thenReturn(detail);
        when(crawledCourseRepository.findDedupCandidates(eq(detail.getType()), anyCollection(), isNull(), any(Pageable.class)))
                .thenReturn(List.of());
    }

    private CourseDetailVO officialDetail(String type, String title, String trainer, CoursePlanDTO plan) {
        CourseDetailVO detail = new CourseDetailVO();
        detail.setId(10);
        detail.setType(type);
        detail.setTitle(title);
        detail.setTrainerName(trainer);
        detail.setDurationDays(2);
        detail.setTotalHours(BigDecimal.valueOf(12));
        detail.setPlans(plan == null ? List.of() : List.of(plan));
        return detail;
    }

    private CoursePlanDTO officialPlan(String startTime, Integer cityId, String address, String onlineUrl) {
        CoursePlanDTO plan = new CoursePlanDTO();
        plan.setStartTime(LocalDateTime.parse(startTime));
        plan.setCityId(cityId);
        plan.setAddress(address);
        plan.setOnlineUrl(onlineUrl);
        return plan;
    }
}
