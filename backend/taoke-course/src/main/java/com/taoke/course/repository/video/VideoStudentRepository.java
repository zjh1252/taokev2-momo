package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoStudent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 录播课学员持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
public interface VideoStudentRepository extends JpaRepository<VideoStudent, Integer> {

    Optional<VideoStudent> findByVideoIdAndUserId(Integer videoId, Integer userId);

    boolean existsByVideoIdAndUserId(Integer videoId, Integer userId);
}
