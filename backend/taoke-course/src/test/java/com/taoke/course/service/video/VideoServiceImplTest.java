package com.taoke.course.service.video;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.course.api.InteractionQueryService;
import com.taoke.course.entity.video.Video;
import com.taoke.course.enums.VideoStatus;
import com.taoke.course.mapper.VideoMapper;
import com.taoke.course.repository.video.VideoChapterRepository;
import com.taoke.course.repository.video.VideoEnrollmentRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.repository.video.VideoSeriesRepository;
import com.taoke.course.support.PublicVideoListCache;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.api.UserService;
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
class VideoServiceImplTest {

    @Mock private VideoRepository videoRepository;
    @Mock private VideoSeriesRepository videoSeriesRepository;
    @Mock private VideoChapterRepository videoChapterRepository;
    @Mock private VideoEnrollmentRepository videoEnrollmentRepository;
    @Mock private VideoMapper videoMapper;
    @Mock private CategoryService categoryService;
    @Mock private TrainerService trainerService;
    @Mock private InstitutionService institutionService;
    @Mock private UserService userService;
    @Mock private BindingAuthority bindingAuthority;
    @Mock private InteractionQueryService interactionQueryService;
    @Mock private VideoPackageService videoPackageService;
    @Mock private OpsMaterialResolver opsMaterialResolver;
    @Mock private PublicVideoListCache publicVideoListCache;

    @InjectMocks
    private VideoServiceImpl service;

    @Test
    void submitForReviewRejectsBlankPersistedCover() {
        Video video = new Video();
        video.setId(1);
        video.setPublisherId(10);
        video.setPublisherType("TRAINER");
        video.setStatus(VideoStatus.DRAFT.getValue());
        video.setIntro("完整课程介绍");
        video.setCoverUrl(" ");
        when(videoRepository.findById(1)).thenReturn(Optional.of(video));

        BusinessException exception = assertThrows(
                BusinessException.class,
                () -> service.submitForReview(1, 10));

        assertEquals("请上传课程封面", exception.getMessage());
        verify(videoRepository, never()).save(video);
    }
}
