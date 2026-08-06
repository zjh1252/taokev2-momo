package com.taoke.course.search;

import com.taoke.course.api.CourseService;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.enums.CourseType;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 搜索课程结果补全测试。
 *
 * @author Fangxinxin
 * @date 2026-08-05 20:15
 */
class CourseSearchResultEnricherTest {

    @Test
    void enrichesMissingTrainerNameWhenSearchIdIsLegacyOpenCoursePlanId() {
        CourseRepository courseRepository = mock(CourseRepository.class);
        CoursePlanRepository coursePlanRepository = mock(CoursePlanRepository.class);
        CourseService courseService = mock(CourseService.class);
        CourseSearchResultEnricher enricher = new CourseSearchResultEnricher(
                courseRepository,
                coursePlanRepository,
                courseService
        );

        Course course = new Course();
        course.setId(83646);
        course.setType(CourseType.OPEN_OFFLINE);
        CoursePlan plan = new CoursePlan();
        plan.setCourseId(83646);
        plan.setSortOrder(100477);
        CourseListItemVO item = new CourseListItemVO();
        item.setId(83646);
        item.setTrainerName("徐老师");
        item.setSeoPathId(100477);

        when(courseRepository.findAllById(List.of(100477))).thenReturn(List.of());
        when(coursePlanRepository.findBySortOrderIn(List.of(100477))).thenReturn(List.of(plan));
        when(courseRepository.findAllById(List.of(83646))).thenReturn(List.of(course));
        when(courseService.assembleListItems(anyList())).thenReturn(List.of(item));

        Map<String, Object> row = new HashMap<>();
        row.put("docType", "course");
        row.put("id", 100477);
        row.put("title", "非人力资源经理的人力资源管理");

        enricher.enrich(List.of(row));

        assertThat(row).containsEntry("trainerName", "徐老师");
        assertThat(row).containsEntry("seoPathId", 100477);
    }
}
