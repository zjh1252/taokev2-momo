package com.taoke.course.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.common.service.RegionService;
import com.taoke.course.entity.Course;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
}
