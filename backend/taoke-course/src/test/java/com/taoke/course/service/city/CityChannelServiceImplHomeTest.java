package com.taoke.course.service.city;

import com.taoke.common.entity.Region;
import com.taoke.common.repository.RegionRepository;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.CourseService;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.city.CityChannelHomeVO;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.course.PublicCourseQuery;
import com.taoke.course.dto.video.VideoListItemVO;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.trainer.TrainerListItemResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 城市综合页 home 聚合单测。
 *
 * @author Fangxinxin
 * @date 2026-07-29 15:50
 */
@ExtendWith(MockitoExtension.class)
class CityChannelServiceImplHomeTest {

    @Mock private RegionRepository regionRepository;
    @Mock private CourseService courseService;
    @Mock private VideoService videoService;
    @Mock private InstitutionService institutionService;
    @Mock private TrainerService trainerService;

    private CityChannelServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CityChannelServiceImpl(
                regionRepository, courseService, videoService, institutionService, trainerService);
    }

    @Test
    void loadHome_unknownCity_returnsNull() {
        when(regionRepository.findByEnName("nowhere")).thenReturn(Optional.empty());
        assertNull(service.loadHome("nowhere"));
    }

    @Test
    void loadHome_shanghai_fetchesFiveBlocksWithExpectedFilters() {
        Region shanghai = new Region();
        shanghai.setId(2);
        shanghai.setLevel(1);
        shanghai.setCode("310000000000");
        shanghai.setName("上海市");
        shanghai.setEnName("shanghai");
        when(regionRepository.findByEnName("shanghai")).thenReturn(Optional.of(shanghai));

        PageResponse<CourseListItemVO> coursePage = PageResponse.of(List.of(), 0, 1, 10);
        PageResponse<VideoListItemVO> videoPage = PageResponse.of(List.of(), 0, 1, 10);
        PageResponse<InstitutionListItemResponse> instPage = PageResponse.of(List.of(), 0, 1, 20);
        PageResponse<TrainerListItemResponse> trainerPage = PageResponse.of(List.of(), 0, 1, 20);

        when(courseService.listPublic(any(PublicCourseQuery.class))).thenReturn(coursePage);
        when(videoService.listPublic(
                isNull(), isNull(), isNull(), eq("time"), isNull(), isNull(), eq(1), eq(10), isNull()))
                .thenReturn(videoPage);
        when(institutionService.listPublic(
                eq(1), eq(20), isNull(), eq("newly_joined"),
                isNull(), isNull(), isNull(), isNull(), eq(2)))
                .thenReturn(instPage);
        when(trainerService.listPublic(
                eq(1), eq(20), isNull(), isNull(), isNull(), eq(2),
                isNull(), eq("newly_joined"), isNull(), eq(false)))
                .thenReturn(trainerPage);

        CityChannelHomeVO home = service.loadHome("shanghai");

        assertNotNull(home);
        assertNotNull(home.getDetail());
        assertEquals("shanghai", home.getDetail().getEnName());
        assertEquals(2, home.getDetail().getCityRegionId());
        assertNotNull(home.getUpcomingOpen());
        assertNotNull(home.getHotInner());
        assertNotNull(home.getLatestOpen());
        assertNotNull(home.getLatestVideos());
        assertNotNull(home.getInstitutions());
        assertNotNull(home.getTrainers());

        ArgumentCaptor<PublicCourseQuery> queryCaptor = ArgumentCaptor.forClass(PublicCourseQuery.class);
        verify(courseService, org.mockito.Mockito.times(3)).listPublic(queryCaptor.capture());
        List<PublicCourseQuery> queries = queryCaptor.getAllValues();

        PublicCourseQuery upcoming = queries.stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsOpen()) && "ENROLLING".equals(q.getEnrollStatus()))
                .findFirst()
                .orElseThrow();
        assertEquals(List.of(2), upcoming.getCityIds());
        assertEquals("time", upcoming.getSortBy());
        assertEquals(10, upcoming.getSize());

        PublicCourseQuery hotInner = queries.stream()
                .filter(q -> Boolean.FALSE.equals(q.getIsOpen()))
                .findFirst()
                .orElseThrow();
        assertEquals(2, hotInner.getTrainerCityId());
        assertEquals("viewCount", hotInner.getSortBy());

        PublicCourseQuery latestOpen = queries.stream()
                .filter(q -> Boolean.TRUE.equals(q.getIsOpen()) && q.getEnrollStatus() == null)
                .findFirst()
                .orElseThrow();
        assertEquals("published", latestOpen.getSortBy());
        assertEquals(List.of(2), latestOpen.getCityIds());

        verify(videoService).listPublic(
                isNull(), isNull(), isNull(), eq("time"), isNull(), isNull(), eq(1), eq(10), isNull());
        verify(institutionService).listPublic(
                eq(1), eq(20), isNull(), eq("newly_joined"),
                isNull(), isNull(), isNull(), isNull(), eq(2));
        verify(trainerService).listPublic(
                eq(1), eq(20), isNull(), isNull(), isNull(), eq(2),
                isNull(), eq("newly_joined"), isNull(), eq(false));
    }
}
