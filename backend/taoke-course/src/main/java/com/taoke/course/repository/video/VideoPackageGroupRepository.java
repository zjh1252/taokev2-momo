package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoPackageGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * 录播课视频包分组仓储（专题头 + 系列课树）
 */
public interface VideoPackageGroupRepository extends JpaRepository<VideoPackageGroup, Integer> {

    Optional<VideoPackageGroup> findByPackageIdAndTopicIdAndParentId(
            Integer packageId, Integer topicId, Integer parentId);

    List<VideoPackageGroup> findByParentId(Integer parentId);

    Optional<VideoPackageGroup> findFirstByParentIdAndTopicId(Integer parentId, Integer topicId);

    @Query("""
            SELECT g FROM VideoPackageGroup g
            WHERE g.topicId = 0 AND g.parentId = 0
            ORDER BY g.packageId ASC
            """)
    List<VideoPackageGroup> findAllTopicHeaders();

    @Query("""
            SELECT g FROM VideoPackageGroup g
            WHERE g.topicId = 0 AND g.parentId = 0 AND g.isOpen = 1
            ORDER BY g.packageId ASC
            """)
    List<VideoPackageGroup> findOpenTopicHeaders();

    @Query("""
            SELECT g FROM VideoPackageGroup g
            WHERE g.topicId > 0
            ORDER BY g.type ASC, g.serialIndex ASC, g.itemIndex ASC, g.topicId ASC
            """)
    List<VideoPackageGroup> findAllSeriesOrderByDefault();

    @Query("""
            SELECT g FROM VideoPackageGroup g
            WHERE g.topicId > 0
            ORDER BY g.packageId DESC, g.itemIndex ASC, g.topicId ASC
            """)
    List<VideoPackageGroup> findAllSeriesOrderBySupplier();

    @Query("""
            SELECT g FROM VideoPackageGroup g
            WHERE g.topicId > 0
              AND EXISTS (
                  SELECT 1 FROM VideoPackageGroup h
                  WHERE h.packageId = g.packageId
                    AND h.topicId = 0 AND h.parentId = 0 AND h.isOpen = 1
              )
            ORDER BY g.type ASC, g.serialIndex ASC, g.itemIndex ASC, g.topicId ASC
            """)
    List<VideoPackageGroup> findOpenSeriesOrderByDefault();

    @Query("""
            SELECT g FROM VideoPackageGroup g
            WHERE g.topicId > 0
              AND EXISTS (
                  SELECT 1 FROM VideoPackageGroup h
                  WHERE h.packageId = g.packageId
                    AND h.topicId = 0 AND h.parentId = 0 AND h.isOpen = 1
              )
            ORDER BY g.packageId DESC, g.itemIndex ASC, g.topicId ASC
            """)
    List<VideoPackageGroup> findOpenSeriesOrderBySupplier();

    Optional<VideoPackageGroup> findFirstByTopicId(Integer topicId);
}
