package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoSupplierCategoryVideo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 供应商分类录播课关联持久化
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
public interface VideoSupplierCategoryVideoRepository extends JpaRepository<VideoSupplierCategoryVideo, Integer> {

    List<VideoSupplierCategoryVideo> findByCategoryIdOrderBySortOrderAscIdAsc(Integer categoryId);

    List<VideoSupplierCategoryVideo> findBySupplierIdAndCategoryIdOrderBySortOrderAscIdAsc(
            Integer supplierId, Integer categoryId);

    Optional<VideoSupplierCategoryVideo> findByCategoryIdAndVideoId(Integer categoryId, Integer videoId);

    void deleteByCategoryId(Integer categoryId);

    void deleteBySupplierId(Integer supplierId);

    long countByCategoryId(Integer categoryId);
}
