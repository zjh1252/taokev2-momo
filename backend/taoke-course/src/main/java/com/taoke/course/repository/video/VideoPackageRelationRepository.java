package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoPackageRelation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    List<VideoPackageRelation> findByParentId(Integer parentId);

    @Query("""
            SELECT COUNT(DISTINCT r.videoId) FROM VideoPackageRelation r, Video v
            WHERE r.videoId = v.id AND v.status = 2
              AND r.parentId = :parentId
              AND (:topicId = 0 OR r.topicId = :topicId)
            """)
    long countPublishedVideosByPackage(@Param("parentId") Integer parentId,
                                       @Param("topicId") Integer topicId);

    @Query("""
            SELECT r.videoId FROM VideoPackageRelation r, Video v
            WHERE r.videoId = v.id AND v.status = 2
              AND r.parentId = :parentId
              AND (:topicId = 0 OR r.topicId = :topicId)
            ORDER BY r.sortOrder ASC, r.videoId ASC
            """)
    List<Integer> findPublishedVideoIdsByPackage(@Param("parentId") Integer parentId,
                                                  @Param("topicId") Integer topicId);

    @Query("""
            SELECT COUNT(DISTINCT s.id) FROM VideoSeries s, Video v, VideoPackageRelation r
            WHERE s.videoId = v.id AND v.status = 2 AND r.videoId = v.id
              AND r.parentId = :parentId
            """)
    long countSeriesEpisodesByPackage(@Param("parentId") Integer parentId);

    /**
     * 同包内下一集（老站 getVideoNextId：is_first=1 主关系 + serial/sort_order 递增）。
     */
    @Query(value = """
            SELECT r.video_id FROM video_package_relations r
            INNER JOIN video_package_relations b
              ON b.video_id = :videoId AND r.package_id = b.package_id
             AND r.parent_id = b.parent_id AND b.is_primary = 1
            INNER JOIN videos v ON v.id = r.video_id AND v.status = 2
            WHERE r.is_primary = 1 AND r.sort_order > b.sort_order
            ORDER BY r.parent_id ASC, r.sort_order ASC
            LIMIT 1
            """, nativeQuery = true)
    Integer findNextPrimaryVideoIdInPackage(@Param("videoId") Integer videoId);
}
