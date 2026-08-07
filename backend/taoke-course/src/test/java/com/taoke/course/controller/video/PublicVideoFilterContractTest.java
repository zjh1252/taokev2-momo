package com.taoke.course.controller.video;

import com.taoke.common.response.PageResponse;
import com.taoke.common.service.CategoryService;
import com.taoke.course.api.CourseService;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.video.VideoListItemVO;
import com.taoke.course.service.video.VideoCommentService;
import com.taoke.course.service.video.VideoPackageService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.*;

class PublicVideoFilterContractTest {

    @Test
    void forwardsFreeAndInclusivePriceFilters() {
        VideoService videoService = mock(VideoService.class);
        PublicVideoController controller = new PublicVideoController(
                videoService,
                mock(CategoryService.class),
                mock(CourseService.class),
                mock(VideoCommentService.class),
                mock(VideoPackageService.class));
        when(videoService.listPublic(
                eq(10), eq(11), eq("质量"), eq("smartcs"), isNull(), isNull(),
                eq(0), eq(new BigDecimal("1000")), eq(new BigDecimal("5000")),
                eq(1), eq(15), isNull()))
                .thenReturn(PageResponse.of(List.<VideoListItemVO>of(), 0, 1, 15));

        controller.list(10, 11, "质量", "smartcs", null, null,
                0, new BigDecimal("1000"), new BigDecimal("5000"), 1, 15);

        verify(videoService).listPublic(
                eq(10), eq(11), eq("质量"), eq("smartcs"), isNull(), isNull(),
                eq(0), eq(new BigDecimal("1000")), eq(new BigDecimal("5000")),
                eq(1), eq(15), isNull());
    }
}
