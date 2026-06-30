package com.taoke.course.repository.video;

import com.taoke.course.entity.video.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
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
                AND (
                    LOWER(COALESCE(v.video_url, '')) LIKE '%.mp4%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '%.m3u8%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '%.webm%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '%.mov%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '%.m4v%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '%.mpd%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '%pxb-videos.taoke.com%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '%sc.cdn.kuanxue.com%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '%preview.kuanxue.com/fsm/%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '/uploads/%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE 'eceibs:%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE 'kuaike:%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE 'kuanxue:%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE 'scho:%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '%@@%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE 'courseid=%'
                    OR LOWER(COALESCE(v.video_url, '')) LIKE '/lease/%'
                    OR EXISTS (
                        SELECT 1
                        FROM video_chapters vc
                        WHERE vc.video_id = v.id
                          AND (
                              LOWER(COALESCE(vc.video_url, '')) LIKE '%.mp4%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '%.m3u8%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '%.webm%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '%.mov%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '%.m4v%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '%.mpd%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '%pxb-videos.taoke.com%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '%sc.cdn.kuanxue.com%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '%preview.kuanxue.com/fsm/%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '/uploads/%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE 'eceibs:%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE 'kuaike:%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE 'kuanxue:%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE 'scho:%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '%@@%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE 'courseid=%'
                              OR LOWER(COALESCE(vc.video_url, '')) LIKE '/lease/%'
                          )
                    )
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
}
