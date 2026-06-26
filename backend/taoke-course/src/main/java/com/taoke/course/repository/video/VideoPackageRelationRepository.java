package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoPackageRelation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 录播课视频包关系仓储
 *
 * @author Fangxinxin
 * @date 2026-06-10 14:00
 */
public interface VideoPackageRelationRepository extends JpaRepository<VideoPackageRelation, Integer> {

    List<VideoPackageRelation> findByVideoIdOrderByPrimaryDescIdAsc(Integer videoId);

    List<VideoPackageRelation> findByPackageIdAndTopicIdAndParentIdOrderBySortOrderAscVideoIdAsc(
            Integer packageId, Integer topicId, Integer parentId);
}
