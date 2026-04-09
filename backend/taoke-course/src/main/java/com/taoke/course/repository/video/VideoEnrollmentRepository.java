package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
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

    /** 批量查指定用户+录播课ID列表的报名记录 */
    List<VideoEnrollment> findByUserIdAndVideoIdIn(Integer userId, List<Integer> videoIds);
}
