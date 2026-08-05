package com.taoke.course.service.pxb;

import com.taoke.course.repository.video.VideoPackageRelationRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PxbLegacyPackageVideoResolverTest {

    @Test
    void topLevelPackage_fallsBackToParentIdTopicId() {
        VideoPackageRelationRepository repo = mock(VideoPackageRelationRepository.class);
        when(repo.findByPackageIdAndTopicIdAndParentIdOrderBySortOrderAscVideoIdAsc(4, 780, 0))
                .thenReturn(List.of());
        when(repo.findPublishedVideoIdsByPackage(780, 0)).thenReturn(List.of(7846, 7852));

        List<Integer> ids = PxbLegacyPackageVideoResolver.resolvePublishedVideoIds(repo, 4, 780, 0);

        assertEquals(List.of(7846, 7852), ids);
        verify(repo).findPublishedVideoIdsByPackage(eq(780), eq(0));
    }

    @Test
    void subSeries_usesParentAndTopicFilter() {
        VideoPackageRelationRepository repo = mock(VideoPackageRelationRepository.class);
        when(repo.findByPackageIdAndTopicIdAndParentIdOrderBySortOrderAscVideoIdAsc(4, 943, 780))
                .thenReturn(List.of());
        when(repo.findPublishedVideoIdsByPackage(780, 943)).thenReturn(List.of(1001));

        List<Integer> ids = PxbLegacyPackageVideoResolver.resolvePublishedVideoIds(repo, 4, 943, 780);

        assertEquals(List.of(1001), ids);
        verify(repo).findPublishedVideoIdsByPackage(eq(780), eq(943));
    }
}
