package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * 录播课评论持久化
 *
 * @author Fangxinxin
 * @date 2026-06-10 16:00
 */
public interface VideoCommentRepository extends JpaRepository<VideoComment, Integer>,
        JpaSpecificationExecutor<VideoComment> {

    Page<VideoComment> findByVideoIdAndVisibleTrueOrderByCreatedAtDesc(Integer videoId, Pageable pageable);

    Page<VideoComment> findByVideoIdAndAuditStatusOrderByCreatedAtDesc(Integer videoId, Integer auditStatus,
                                                                        Pageable pageable);

    long countByVideoIdAndVisibleTrue(Integer videoId);

    long countByVideoIdAndAuditStatus(Integer videoId, Integer auditStatus);
}
