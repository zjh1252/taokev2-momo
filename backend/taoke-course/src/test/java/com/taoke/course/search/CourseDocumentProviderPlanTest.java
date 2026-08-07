package com.taoke.course.search;

import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.search.BaseDocument;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.enums.CourseType;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.support.LegacyTaokeCourseReader;
import com.taoke.user.api.TrainerService;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CourseDocumentProviderPlanTest {

    @Test
    void batchLoadsAndCopiesAllPlansIntoCourseDocument() {
        CourseRepository courseRepository = mock(CourseRepository.class);
        CoursePlanRepository planRepository = mock(CoursePlanRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        TrainerService trainerService = mock(TrainerService.class);
        OpsMaterialResolver materials = mock(OpsMaterialResolver.class);
        LegacyTaokeCourseReader legacy = mock(LegacyTaokeCourseReader.class);
        CourseDocumentProvider provider = new CourseDocumentProvider(
                courseRepository, planRepository, categoryRepository, trainerService, materials, legacy);

        Course course = new Course();
        course.setId(7);
        course.setTitle("质量管理公开课");
        course.setType(CourseType.OPEN_OFFLINE);
        course.setCategoryId(0);
        course.setSubCategoryId(0);
        course.setTrainerId(0);
        when(courseRepository.findAll(any(Specification.class))).thenReturn(List.of(course));
        when(legacy.loadListEnrichment(List.of(7))).thenReturn(new LegacyTaokeCourseReader.ListEnrichment(
                Map.of(), Map.of(), Map.of(), Map.of(), Map.of(), Map.of()));
        when(categoryRepository.findAllById(any())).thenReturn(List.of());
        when(materials.resolveCourseCoverUrl(any(), any(), any(), any(), anyInt())).thenReturn("");

        CoursePlan first = plan(71, 7, 2, 9, LocalDateTime.of(2026, 8, 10, 9, 0));
        CoursePlan second = plan(72, 7, 2, 10, LocalDateTime.of(2026, 8, 20, 9, 0));
        when(planRepository.findByCourseIdInOrderByStartTimeAsc(List.of(7)))
                .thenReturn(List.of(first, second));

        List<? extends BaseDocument> documents = provider.fetchAll();

        CourseDocument document = (CourseDocument) documents.getFirst();
        assertEquals(2, document.getPlans().size());
        assertEquals(71, document.getPlans().getFirst().getPlanId());
        assertEquals(9, document.getPlans().getFirst().getCityId());
        verify(planRepository, times(1)).findByCourseIdInOrderByStartTimeAsc(List.of(7));
    }

    private static CoursePlan plan(int id, int courseId, int provinceId, int cityId, LocalDateTime start) {
        CoursePlan plan = new CoursePlan();
        plan.setId(id);
        plan.setCourseId(courseId);
        plan.setProvinceId(provinceId);
        plan.setCityId(cityId);
        plan.setStartTime(start);
        plan.setEndTime(start.plusDays(1));
        return plan;
    }
}
