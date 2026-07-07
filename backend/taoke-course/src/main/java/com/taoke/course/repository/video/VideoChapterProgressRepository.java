package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoChapterProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 录播课章节学习进度持久化
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:00
 */
public interface VideoChapterProgressRepository extends JpaRepository<VideoChapterProgress, Integer> {

    Optional<VideoChapterProgress> findByChapterIdAndUserId(Integer chapterId, Integer userId);

    List<VideoChapterProgress> findByVideoIdAndUserId(Integer videoId, Integer userId);

    List<VideoChapterProgress> findByUserIdAndVideoIdIn(Integer userId, Collection<Integer> videoIds);

    boolean existsByVideoIdAndUserId(Integer videoId, Integer userId);
}
