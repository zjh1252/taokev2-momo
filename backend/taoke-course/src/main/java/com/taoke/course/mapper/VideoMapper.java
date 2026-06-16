package com.taoke.course.mapper;

import com.taoke.course.dto.video.*;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoChapter;
import com.taoke.course.entity.video.VideoSeries;
import com.taoke.course.enums.VideoStatus;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 录播课对象映射器
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Component
public class VideoMapper {

    public VideoDetailVO toDetailVO(Video video) {
        if (video == null) {
            return null;
        }

        VideoDetailVO vo = new VideoDetailVO();
        vo.setId(video.getId());
        vo.setTitle(video.getTitle());
        vo.setVideoType(video.getVideoType() == null ? null : video.getVideoType().name());
        vo.setVideoTypeLabel(video.getVideoType() == null ? null : video.getVideoType().getLabel());
        vo.setPublisherId(video.getPublisherId());
        vo.setPublisherType(video.getPublisherType());
        vo.setCategoryId(video.getCategoryId());
        vo.setSubCategoryId(video.getSubCategoryId());
        vo.setCoverUrl(video.getCoverUrl());
        vo.setIntro(video.getIntro());
        vo.setVideoUrl(video.getVideoUrl());
        vo.setExternalUrl(video.getExternalUrl());
        vo.setTeacherName(video.getTeacherName());
        vo.setTrainerId(video.getTrainerId());
        vo.setPrice(video.getPrice());
        vo.setOriginalPrice(video.getOriginalPrice());
        vo.setIsFree(video.getIsFree());
        vo.setKeywords(video.getKeywords());
        vo.setDuration(video.getDuration());
        vo.setTotalEpisodes(video.getTotalEpisodes());
        vo.setIsFeatured(video.getIsFeatured());
        vo.setStatus(video.getStatus());
        vo.setStatusLabel(resolveStatusLabel(video.getStatus()));
        vo.setRejectReason(video.getRejectReason());
        vo.setSortOrder(video.getSortOrder());
        vo.setViewCount(video.getViewCount());
        vo.setEnrollmentCount(video.getEnrollmentCount());
        vo.setStudentCount(video.getStudentCount());
        vo.setScore(video.getScore());
        vo.setPublishedAt(video.getPublishedAt());
        vo.setCreatedAt(video.getCreatedAt());
        vo.setUpdatedAt(video.getUpdatedAt());
        return vo;
    }

    public VideoListItemVO toListItemVO(Video video) {
        if (video == null) {
            return null;
        }

        VideoListItemVO vo = new VideoListItemVO();
        vo.setId(video.getId());
        vo.setTitle(video.getTitle());
        vo.setVideoType(video.getVideoType() == null ? null : video.getVideoType().name());
        vo.setVideoTypeLabel(video.getVideoType() == null ? null : video.getVideoType().getLabel());
        vo.setCoverUrl(video.getCoverUrl());
        vo.setCategoryId(video.getCategoryId());
        vo.setTeacherName(video.getTeacherName());
        vo.setPrice(video.getPrice());
        vo.setOriginalPrice(video.getOriginalPrice());
        vo.setIsFree(video.getIsFree());
        vo.setDuration(video.getDuration());
        vo.setTotalEpisodes(video.getTotalEpisodes());
        vo.setStatus(video.getStatus());
        vo.setStatusLabel(resolveStatusLabel(video.getStatus()));
        vo.setViewCount(video.getViewCount());
        vo.setEnrollmentCount(video.getEnrollmentCount());
        vo.setStudentCount(video.getStudentCount());
        vo.setScore(video.getScore());
        vo.setPublisherId(video.getPublisherId());
        vo.setPublisherType(video.getPublisherType());
        vo.setKeywords(video.getKeywords());
        vo.setIsFeatured(video.getIsFeatured());
        vo.setSortOrder(video.getSortOrder());
        vo.setStickyPriority(video.getStickyPriority());
        vo.setPublishedAt(video.getPublishedAt());
        vo.setCreatedAt(video.getCreatedAt());
        return vo;
    }

    public VideoSeriesVO toSeriesVO(VideoSeries series) {
        if (series == null) {
            return null;
        }

        VideoSeriesVO vo = new VideoSeriesVO();
        vo.setId(series.getId());
        vo.setVideoId(series.getVideoId());
        vo.setTitle(series.getTitle());
        vo.setDescription(series.getDescription());
        vo.setCoverUrl(series.getCoverUrl());
        vo.setSortOrder(series.getSortOrder());
        vo.setCreatedAt(series.getCreatedAt());
        vo.setUpdatedAt(series.getUpdatedAt());
        return vo;
    }

    public List<VideoSeriesVO> toSeriesVOList(List<VideoSeries> list) {
        if (list == null) {
            return null;
        }
        return list.stream().map(this::toSeriesVO).toList();
    }

    public VideoChapterVO toChapterVO(VideoChapter chapter) {
        if (chapter == null) {
            return null;
        }

        VideoChapterVO vo = new VideoChapterVO();
        vo.setId(chapter.getId());
        vo.setVideoId(chapter.getVideoId());
        vo.setSeriesId(chapter.getSeriesId());
        vo.setTitle(chapter.getTitle());
        vo.setDescription(chapter.getDescription());
        vo.setVideoUrl(chapter.getVideoUrl());
        vo.setCoverUrl(chapter.getCoverUrl());
        vo.setDuration(chapter.getDuration());
        vo.setFileSize(chapter.getFileSize());
        vo.setSortOrder(chapter.getSortOrder());
        vo.setIsPreview(chapter.getIsPreview());
        vo.setCreatedAt(chapter.getCreatedAt());
        vo.setUpdatedAt(chapter.getUpdatedAt());
        return vo;
    }

    public List<VideoChapterVO> toChapterVOList(List<VideoChapter> list) {
        if (list == null) {
            return null;
        }
        return list.stream().map(this::toChapterVO).toList();
    }

    private String resolveStatusLabel(Integer status) {
        if (status == null) {
            return null;
        }
        try {
            return VideoStatus.of(status).getLabel();
        } catch (IllegalArgumentException e) {
            return "未知";
        }
    }
}
