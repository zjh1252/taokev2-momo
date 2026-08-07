package com.taoke.course.controller;

import com.taoke.course.api.CourseService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PublicCourseControllerGuidedCountsTest {

    @Test
    void includeChildrenIsForwardedWithoutChangingResponseShape() {
        CourseService service = mock(CourseService.class);
        when(service.countPublicByCategoryL1(true, List.of(123), true))
                .thenReturn(Map.of(175, 10L, 225, 4L));
        PublicCourseController controller = new PublicCourseController(service);

        var response = controller.categoryCounts(true, List.of(123), true);

        assertEquals(Map.of(175, 10L, 225, 4L), response.getData());
        verify(service).countPublicByCategoryL1(true, List.of(123), true);
    }

    @Test
    void oldDefaultCanRequestRootCountsOnly() {
        CourseService service = mock(CourseService.class);
        when(service.countPublicByCategoryL1(false, null, false)).thenReturn(Map.of(175, 8L));
        PublicCourseController controller = new PublicCourseController(service);

        controller.categoryCounts(false, null, false);

        verify(service).countPublicByCategoryL1(false, null, false);
    }
}
