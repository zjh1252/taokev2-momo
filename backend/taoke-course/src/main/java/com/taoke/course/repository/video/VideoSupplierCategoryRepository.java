package com.taoke.course.repository.video;

import com.taoke.course.entity.video.VideoSupplierCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 录播课供应商分类持久化
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
public interface VideoSupplierCategoryRepository extends JpaRepository<VideoSupplierCategory, Integer> {

    List<VideoSupplierCategory> findBySupplierIdOrderBySortOrderAscIdAsc(Integer supplierId);

    List<VideoSupplierCategory> findBySupplierIdAndParentIdOrderBySortOrderAscIdAsc(Integer supplierId, Integer parentId);

    long countBySupplierIdAndParentId(Integer supplierId, Integer parentId);

    void deleteBySupplierId(Integer supplierId);
}
