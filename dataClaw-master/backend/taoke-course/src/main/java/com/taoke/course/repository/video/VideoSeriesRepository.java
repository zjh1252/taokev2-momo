package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoSeries;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 录播课系列持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
public interface VideoSeriesRepository extends JpaRepository<VideoSeries, Integer> {

    List<VideoSeries> findByVideoIdOrderBySortOrderAsc(Integer videoId);

    int countByVideoId(Integer videoId);

    void deleteByVideoId(Integer videoId);
}
