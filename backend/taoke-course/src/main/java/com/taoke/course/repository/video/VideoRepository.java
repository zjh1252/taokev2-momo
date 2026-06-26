package com.taoke.course.repository.video;

import com.taoke.course.entity.video.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * 录播课持久化
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
public interface VideoRepository extends JpaRepository<Video, Integer>, JpaSpecificationExecutor<Video> {

    /** 已上架录播课按一级分类批量计数 */
    @Query(value = """
            SELECT sc.id AS category_id, COUNT(DISTINCT v.id) AS cnt
            FROM sys_categories sc
            LEFT JOIN sys_categories sc2 ON sc2.parent_id = sc.id AND sc2.type = 'VIDEO_COURSE'
            LEFT JOIN videos v ON v.status = 2
                AND (
                    v.category_id = sc.id
                    OR v.sub_category_id = sc.id
                    OR v.sub_category_id = sc2.id
                )
            WHERE sc.type = 'VIDEO_COURSE'
              AND sc.level = 1
              AND sc.is_visible = 1
            GROUP BY sc.id
            """, nativeQuery = true)
    List<Object[]> countPublishedByCategoryL1();

    /** 查询当前最大排序值，用于置顶计算 */
    @Query("SELECT COALESCE(MAX(v.sortOrder), 0) FROM Video v")
    Optional<Integer> findMaxSortOrder();

    List<Video> findByPublisherIdIn(List<Integer> publisherIds);

    @org.springframework.data.jpa.repository.Query(
            "SELECT v.publisherId, COUNT(v) FROM Video v WHERE v.publisherId IN :ids GROUP BY v.publisherId")
    List<Object[]> countGroupByPublisherIds(
            @org.springframework.data.repository.query.Param("ids") java.util.Collection<Integer> ids);

    @Query("""
            SELECT v FROM Video v
            WHERE v.status = 2 AND (v.isFeatured = 1 OR v.stickyPriority > 0)
            ORDER BY v.sortOrder DESC, v.id DESC
            """)
    List<Video> findLegacyFeaturedVideos(Pageable pageable);

    @Query("""
            SELECT v FROM Video v
            WHERE v.status = 2
            ORDER BY v.sortOrder DESC, v.id DESC
            """)
    List<Video> findLegacyPublishedVideos(Pageable pageable);

    Optional<Video> findFirstByPxbSupplierIdAndLegacyVType(Integer pxbSupplierId, Integer legacyVType);
}
