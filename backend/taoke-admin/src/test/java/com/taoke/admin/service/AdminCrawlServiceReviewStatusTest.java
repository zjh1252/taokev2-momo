package com.taoke.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.admin.dto.crawl.CrawledCourseQuery;
import com.taoke.admin.dto.crawl.CrawledCourseVO;
import com.taoke.admin.entity.CrawledCourse;
import com.taoke.admin.repository.CrawlSourceRepository;
import com.taoke.admin.repository.CrawlJobRepository;
import com.taoke.admin.repository.CrawledCourseRepository;
import com.taoke.admin.repository.CrawledTrainerRepository;
import com.taoke.common.dto.PageResult;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.RegionService;
import com.taoke.course.api.CourseService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.api.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminCrawlServiceReviewStatusTest {

    private final CrawlSourceRepository crawlSourceRepository = mock(CrawlSourceRepository.class);
    private final CrawledTrainerRepository crawledTrainerRepository = mock(CrawledTrainerRepository.class);
    private final CrawledCourseRepository crawledCourseRepository = mock(CrawledCourseRepository.class);
    private final CrawlJobRepository crawlJobRepository = mock(CrawlJobRepository.class);
    private final CrawlerClientService crawlerClientService = mock(CrawlerClientService.class);
    private final CourseDuplicateService courseDuplicateService = mock(CourseDuplicateService.class);
    private final TrainerService trainerService = mock(TrainerService.class);
    private final UserService userService = mock(UserService.class);
    private final RoleApplyService roleApplyService = mock(RoleApplyService.class);
    private final CourseService courseService = mock(CourseService.class);
    private final TrainerCaseService trainerCaseService = mock(TrainerCaseService.class);
    private final RegionService regionService = mock(RegionService.class);
    private final CategoryService categoryService = mock(CategoryService.class);
    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);

    private final AdminCrawlService service = new AdminCrawlService(
            crawlSourceRepository,
            crawledTrainerRepository,
            crawledCourseRepository,
            crawlJobRepository,
            crawlerClientService,
            courseDuplicateService,
            trainerService,
            userService,
            roleApplyService,
            courseService,
            trainerCaseService,
            regionService,
            categoryService,
            new ObjectMapper(),
            jdbcTemplate);

    @Test
    void restoresRejectedCourseToPendingReview() {
        CrawledCourse course = baseCourse();
        course.setReviewStatus(2);
        course.setReviewRejectReason("内容不完整");
        course.setReviewedAt(LocalDateTime.of(2026, 7, 10, 10, 0));
        when(crawledCourseRepository.findById(10)).thenReturn(Optional.of(course));

        service.restoreCrawledCourse(10);

        assertThat(course.getReviewStatus()).isZero();
        assertThat(course.getReviewRejectReason()).isNull();
        assertThat(course.getReviewedAt()).isNull();
        verify(crawledCourseRepository).save(course);
    }

    @Test
    void refusesRestoreWhenCourseIsNotRejected() {
        CrawledCourse course = baseCourse();
        course.setReviewStatus(0);
        when(crawledCourseRepository.findById(10)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> service.restoreCrawledCourse(10))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("只有已驳回课程可以恢复待审核");
    }

    @Test
    void refusesRestoreWhenRejectedCourseAlreadyHasImportedCourse() {
        CrawledCourse course = baseCourse();
        course.setReviewStatus(2);
        course.setImportedCourseId(99);
        when(crawledCourseRepository.findById(10)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> service.restoreCrawledCourse(10))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("已关联正式课程");
    }

    @Test
    void crawledCourseListReturnsReviewStatusFields() {
        CrawledCourse course = baseCourse();
        course.setReviewStatus(3);
        course.setReviewRejectReason("历史驳回原因");
        course.setReviewedAt(LocalDateTime.of(2026, 7, 10, 11, 30));
        course.setImportedCourseId(88);
        when(crawledCourseRepository.searchCourses(
                any(), eq(3), any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(course), PageRequest.of(0, 10), 1));

        CrawledCourseQuery query = new CrawledCourseQuery();
        query.setPage(1);
        query.setSize(10);
        query.setReviewStatus(3);
        PageResult<CrawledCourseVO> result = service.listCrawledCourses(query);

        CrawledCourseVO vo = result.getList().get(0);
        assertThat(vo.getReviewStatus()).isEqualTo(3);
        assertThat(vo.getReviewStatusText()).isEqualTo("已入库");
        assertThat(vo.getReviewRejectReason()).isEqualTo("历史驳回原因");
        assertThat(vo.getReviewedAt()).isEqualTo(LocalDateTime.of(2026, 7, 10, 11, 30));
        assertThat(vo.getImportedCourseId()).isEqualTo(88);
    }

    private CrawledCourse baseCourse() {
        CrawledCourse course = new CrawledCourse();
        course.setId(10);
        course.setSource("source");
        course.setSourceUrl("https://example.com/course");
        course.setSourceCourseId("source-10");
        course.setTitle("AI 赋能销售管理");
        course.setType("OPEN_OFFLINE");
        course.setCategoryId(0);
        course.setSubCategoryId(0);
        course.setDedupStatus(1);
        course.setRawJson("{}");
        course.setCreatedAt(LocalDateTime.of(2026, 7, 10, 9, 0));
        return course;
    }
}
