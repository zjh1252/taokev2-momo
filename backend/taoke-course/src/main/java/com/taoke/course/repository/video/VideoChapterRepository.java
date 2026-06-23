package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoChapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 录播课章节持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
public interface VideoChapterRepository extends JpaRepository<VideoChapter, Integer> {

    List<VideoChapter> findByVideoIdOrderBySortOrderAsc(Integer videoId);

    List<VideoChapter> findByVideoIdAndSeriesIdOrderBySortOrderAsc(Integer videoId, Integer seriesId);

    int countByVideoId(Integer videoId);

    int countBySeriesId(Integer seriesId);

    void deleteByVideoId(Integer videoId);

    void deleteBySeriesId(Integer seriesId);

    Optional<VideoChapter> findFirstByVideoIdAndPxbSupplierId(Integer videoId, Integer pxbSupplierId);
}
