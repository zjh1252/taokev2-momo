package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoStudent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    /** 按 userId 分页查学习记录，最近观看时间倒序 */
    Page<VideoStudent> findByUserIdOrderByLastWatchedAtDesc(Integer userId, Pageable pageable);

    /** 查该用户未完成的最近一条学习记录 */
    Optional<VideoStudent> findFirstByUserIdAndIsCompletedOrderByLastWatchedAtDesc(Integer userId, Integer isCompleted);
}
