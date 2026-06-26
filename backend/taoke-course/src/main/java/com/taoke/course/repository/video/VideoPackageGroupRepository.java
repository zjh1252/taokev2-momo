package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoPackageGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 录播课视频包分组仓储
 *
 * @author Fangxinxin
 * @date 2026-06-10 18:00
 */
public interface VideoPackageGroupRepository extends JpaRepository<VideoPackageGroup, Integer> {

    Optional<VideoPackageGroup> findByPackageIdAndTopicIdAndParentId(
            Integer packageId, Integer topicId, Integer parentId);

    List<VideoPackageGroup> findByParentId(Integer parentId);

    Optional<VideoPackageGroup> findFirstByParentIdAndTopicId(Integer parentId, Integer topicId);
}
