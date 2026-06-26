package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.video.*;

import java.util.List;

/**
 * 录播课供应商管理接口 — 供 taoke-admin 编排层调用
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
public interface VideoSupplierAdminService {

    PageResponse<VideoSupplierVO> listSuppliers(String keyword, Boolean enabled, int page, int size);

    VideoSupplierVO getSupplier(Integer id);

    VideoSupplierVO createSupplier(SaveVideoSupplierRequest request);

    VideoSupplierVO updateSupplier(Integer id, SaveVideoSupplierRequest request);

    void deleteSupplier(Integer id);

    List<VideoSupplierCategoryVO> listCategoryTree(Integer supplierId);

    VideoSupplierCategoryVO createCategory(Integer supplierId, SaveVideoSupplierCategoryRequest request);

    VideoSupplierCategoryVO updateCategory(Integer supplierId, Integer categoryId,
                                            SaveVideoSupplierCategoryRequest request);

    void deleteCategory(Integer supplierId, Integer categoryId);

    List<VideoListItemVO> listCategoryVideos(Integer supplierId, Integer categoryId);

    void assignCategoryVideos(Integer supplierId, Integer categoryId, SaveSupplierCategoryVideoRequest request);

    void removeCategoryVideo(Integer supplierId, Integer categoryId, Integer videoId);
}
