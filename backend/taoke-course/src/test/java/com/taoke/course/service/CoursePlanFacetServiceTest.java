package com.taoke.course.service;

import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.common.service.RegionService;
import com.taoke.course.dto.course.CoursePlanFacetRequest;
import com.taoke.course.entity.Course;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CoursePlanFacetServiceTest {
    @Mock CourseRepository courseRepository;
    @Mock CoursePlanRepository coursePlanRepository;
    @Mock CourseMapper courseMapper;
    @Mock CategoryService categoryService;
    @Mock CategoryRepository categoryRepository;
    @Mock TrainerService trainerService;
    @Mock InstitutionService institutionService;
    @Mock RegionService regionService;
    @Mock LegacyTaokeCourseReader legacyTaokeCourseReader;
    @Mock BindingAuthority bindingAuthority;
    @Mock OpsMaterialResolver opsMaterialResolver;
    @Mock PublicCourseListCache publicCourseListCache;
    @InjectMocks CourseServiceImpl service;

    @Test
    void returnsProvinceAndCityCountsForCurrentCombination() {
        when(courseRepository.countFuturePlanProvinces(
                eq("OPEN_OFFLINE"), eq(10), eq(11), eq(0),
                eq(new BigDecimal("1000")), eq(new BigDecimal("5000")), any(), any()))
                .thenReturn(List.<Object[]>of(new Object[]{2, 7L}));
        when(courseRepository.countFuturePlanCities(
                eq("OPEN_OFFLINE"), eq(2), eq(10), eq(11), eq(0),
                eq(new BigDecimal("1000")), eq(new BigDecimal("5000")), any(), any()))
                .thenReturn(List.<Object[]>of(new Object[]{9, 4L}));
        CoursePlanFacetRequest request = new CoursePlanFacetRequest();
        request.setCourseType("OPEN_OFFLINE");
        request.setCategoryId(10);
        request.setSubCategoryId(11);
        request.setIsFree(0);
        request.setMinPrice(new BigDecimal("1000"));
        request.setMaxPrice(new BigDecimal("5000"));
        request.setProvinceId(2);
        request.setPlanStartFrom(LocalDateTime.of(2026, 8, 1, 0, 0));
        request.setPlanStartTo(LocalDateTime.of(2026, 8, 31, 23, 59));

        var response = service.getPublicPlanLocationFacets(request);

        assertEquals(2, response.provinces().getFirst().id());
        assertEquals(7, response.provinces().getFirst().count());
        assertEquals(9, response.cities().getFirst().id());
        assertEquals(4, response.cities().getFirst().count());
    }

    @Test
    void touchesParentCourseAfterPlanReplacement() {
        Course course = new Course();
        course.setId(42);
        LocalDateTime previousUpdatedAt = LocalDateTime.of(2026, 1, 1, 0, 0);
        course.setUpdatedAt(previousUpdatedAt);
        when(courseRepository.findById(42)).thenReturn(Optional.of(course));

        ReflectionTestUtils.invokeMethod(service, "touchCourseForSearchSync", 42);

        assertNotNull(course.getUpdatedAt());
        org.junit.jupiter.api.Assertions.assertTrue(course.getUpdatedAt().isAfter(previousUpdatedAt));
        verify(courseRepository).save(course);
    }
}
