package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 录播课报名持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
public interface VideoEnrollmentRepository extends JpaRepository<VideoEnrollment, Integer> {

    Optional<VideoEnrollment> findByVideoIdAndUserId(Integer videoId, Integer userId);

    boolean existsByVideoIdAndUserIdAndStatus(Integer videoId, Integer userId, Integer status);
}
