package com.taoke.course.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.common.service.RegionService;
import com.taoke.course.dto.course.CourseDetailVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.enums.CourseType;
import com.taoke.course.mapper.CourseMapper;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.support.LegacyTaokeCourseReader;
import com.taoke.course.support.PublicCourseListCache;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    @Mock private CourseRepository courseRepository;
    @Mock private CoursePlanRepository coursePlanRepository;
    @Mock private CourseMapper courseMapper;
    @Mock private CategoryService categoryService;
    @Mock private CategoryRepository categoryRepository;
    @Mock private TrainerService trainerService;
    @Mock private InstitutionService institutionService;
    @Mock private RegionService regionService;
    @Mock private LegacyTaokeCourseReader legacyTaokeCourseReader;
    @Mock private BindingAuthority bindingAuthority;
    @Mock private OpsMaterialResolver opsMaterialResolver;
    @Mock private PublicCourseListCache publicCourseListCache;

    @InjectMocks
    private CourseServiceImpl service;

    @Test
    void submitForReviewRejectsBlankPersistedCover() {
        Course course = new Course();
        course.setId(1);
        course.setPublisherId(10);
        course.setPublisherType("TRAINER");
        course.setStatus(CourseStatus.DRAFT.getValue());
        course.setType(CourseType.INTERNAL);
        course.setIntro("完整课程介绍");
        course.setCoverUrl(" ");
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.submitForReview(1, 10));

        assertEquals("请上传课程封面", exception.getMessage());
        verify(courseRepository, never()).save(course);
    }

    @Test
    void withdrawFromReviewMovesPendingToDraft() {
        Course course = new Course();
        course.setId(1);
        course.setPublisherId(10);
        course.setPublisherType("TRAINER");
        course.setStatus(CourseStatus.PENDING.getValue());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(courseRepository.save(any(Course.class))).thenAnswer(inv -> inv.getArgument(0));

        service.withdrawFromReview(1, 10);

        assertEquals(CourseStatus.DRAFT.getValue(), course.getStatus());
        verify(courseRepository).save(course);
    }

    @Test
    void withdrawFromReviewRejectsNonPending() {
        Course course = new Course();
        course.setId(1);
        course.setPublisherId(10);
        course.setPublisherType("TRAINER");
        course.setStatus(CourseStatus.DRAFT.getValue());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.withdrawFromReview(1, 10));

        assertEquals("仅待审核状态的课程可撤回", exception.getMessage());
        verify(courseRepository, never()).save(course);
    }

    @Test
    void getPublicDetail_resolvesPublishedCourseByLegacyPlanSortOrder() {
        when(courseRepository.findById(438103)).thenReturn(Optional.empty());

        CoursePlan plan = new CoursePlan();
        plan.setId(1);
        plan.setCourseId(276819);
        plan.setSortOrder(438103);
        when(coursePlanRepository.findFirstBySortOrderOrderByIdAsc(438103))
                .thenReturn(Optional.of(plan));

        Course course = publishedOpenCourse(276819, "向HW学习流程体系建设与高效运营");
        when(courseRepository.findById(276819)).thenReturn(Optional.of(course));
        stubAssembleDetailMinimal(course);

        CourseDetailVO result = service.getPublicDetail(438103);

        assertEquals(276819, result.getId());
        verify(coursePlanRepository).findFirstBySortOrderOrderByIdAsc(438103);
    }

    @Test
    void getPublicDetail_prefersCourseIdWhenBothMatch() {
        Course course = publishedOpenCourse(276819, "向HW学习流程体系建设与高效运营");
        when(courseRepository.findById(276819)).thenReturn(Optional.of(course));
        stubAssembleDetailMinimal(course);

        CourseDetailVO result = service.getPublicDetail(276819);

        assertEquals(276819, result.getId());
        verify(coursePlanRepository, never()).findFirstBySortOrderOrderByIdAsc(any());
    }

    @Test
    void getPublicDetail_setsDisplayCourseNoFromUpcomingPlanSortOrder() {
        Course course = publishedOpenCourse(276819, "向HW学习流程体系建设与高效运营");
        when(courseRepository.findById(276819)).thenReturn(Optional.of(course));

        CoursePlan plan = new CoursePlan();
        plan.setId(10);
        plan.setCourseId(276819);
        plan.setSortOrder(438103);
        plan.setStartTime(LocalDateTime.now().plusDays(3));
        plan.setEndTime(LocalDateTime.now().plusDays(4));
        when(coursePlanRepository.findByCourseIdOrderBySortOrder(276819)).thenReturn(List.of(plan));

        CourseDetailVO detail = new CourseDetailVO();
        detail.setId(276819);
        when(courseMapper.toDetailVO(course)).thenReturn(detail);
        when(courseMapper.toPlanDTOList(List.of(plan))).thenReturn(List.of());
        when(legacyTaokeCourseReader.findCoverUrlsByCourseIds(List.of(276819))).thenReturn(Map.of());
        when(legacyTaokeCourseReader.findOrganizerUserIds(List.of(276819))).thenReturn(Map.of());
        when(legacyTaokeCourseReader.findOrganizerNamesFromLecturer(List.of(276819))).thenReturn(Map.of());

        CourseDetailVO result = service.getPublicDetail(276819);

        assertEquals(438103, result.getDisplayCourseNo());
    }

    @Test
    void resolvePublicSortDefaultsToScoreDesc() {
        assertDefaultScoreDesc(ReflectionTestUtils.invokeMethod(service, "resolvePublicSort", (String) null));
        assertDefaultScoreDesc(ReflectionTestUtils.invokeMethod(service, "resolvePublicSort", "default"));
        assertDefaultScoreDesc(ReflectionTestUtils.invokeMethod(service, "resolvePublicSort", "unknown"));
    }

    @Test
    void resolvePublicSortDefaultAscUsesScoreAsc() {
        Sort sort = ReflectionTestUtils.invokeMethod(service, "resolvePublicSort", "default_asc");
        List<Sort.Order> orders = new ArrayList<>();
        sort.forEach(orders::add);
        assertEquals(2, orders.size());
        assertEquals("score", orders.get(0).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(0).getDirection());
        assertEquals("id", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    private static void assertDefaultScoreDesc(Sort sort) {
        List<Sort.Order> orders = new ArrayList<>();
        sort.forEach(orders::add);
        assertEquals(2, orders.size());
        assertEquals("score", orders.get(0).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(0).getDirection());
        assertEquals("id", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
    }

    private static Course publishedOpenCourse(int id, String title) {
        Course course = new Course();
        course.setId(id);
        course.setStatus(CourseStatus.PUBLISHED.getValue());
        course.setType(CourseType.OPEN_OFFLINE);
        course.setTitle(title);
        course.setPublisherType("TRAINER");
        return course;
    }

    private void stubAssembleDetailMinimal(Course course) {
        CourseDetailVO detail = new CourseDetailVO();
        detail.setId(course.getId());
        when(courseMapper.toDetailVO(course)).thenReturn(detail);
        when(coursePlanRepository.findByCourseIdOrderBySortOrder(course.getId())).thenReturn(List.of());
        when(legacyTaokeCourseReader.findCoverUrlsByCourseIds(List.of(course.getId()))).thenReturn(Map.of());
        when(legacyTaokeCourseReader.findOrganizerUserIds(List.of(course.getId()))).thenReturn(Map.of());
        when(legacyTaokeCourseReader.findOrganizerNamesFromLecturer(List.of(course.getId()))).thenReturn(Map.of());
    }
}
