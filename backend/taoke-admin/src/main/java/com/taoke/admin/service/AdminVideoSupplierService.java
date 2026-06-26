package com.taoke.admin.service;

import com.taoke.admin.dto.AdminVideoSupplierQuery;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.VideoSupplierAdminService;
import com.taoke.course.dto.video.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 后台录播课供应商编排服务
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Service
@RequiredArgsConstructor
public class AdminVideoSupplierService {

    private final VideoSupplierAdminService videoSupplierAdminService;

    public PageResponse<VideoSupplierVO> list(AdminVideoSupplierQuery query) {
        return videoSupplierAdminService.listSuppliers(
                query.getKeyword(), query.getEnabled(), query.getPage(), query.getSize());
    }

    public VideoSupplierVO get(Integer id) {
        return videoSupplierAdminService.getSupplier(id);
    }

    public VideoSupplierVO create(SaveVideoSupplierRequest request) {
        return videoSupplierAdminService.createSupplier(request);
    }

    public VideoSupplierVO update(Integer id, SaveVideoSupplierRequest request) {
        return videoSupplierAdminService.updateSupplier(id, request);
    }

    public void delete(Integer id) {
        videoSupplierAdminService.deleteSupplier(id);
    }

    public List<VideoSupplierCategoryVO> listCategories(Integer supplierId) {
        return videoSupplierAdminService.listCategoryTree(supplierId);
    }

    public VideoSupplierCategoryVO createCategory(Integer supplierId, SaveVideoSupplierCategoryRequest request) {
        return videoSupplierAdminService.createCategory(supplierId, request);
    }

    public VideoSupplierCategoryVO updateCategory(Integer supplierId, Integer categoryId,
                                                   SaveVideoSupplierCategoryRequest request) {
        return videoSupplierAdminService.updateCategory(supplierId, categoryId, request);
    }

    public void deleteCategory(Integer supplierId, Integer categoryId) {
        videoSupplierAdminService.deleteCategory(supplierId, categoryId);
    }

    public List<VideoListItemVO> listCategoryVideos(Integer supplierId, Integer categoryId) {
        return videoSupplierAdminService.listCategoryVideos(supplierId, categoryId);
    }

    public void assignCategoryVideos(Integer supplierId, Integer categoryId,
                                      SaveSupplierCategoryVideoRequest request) {
        videoSupplierAdminService.assignCategoryVideos(supplierId, categoryId, request);
    }

    public void removeCategoryVideo(Integer supplierId, Integer categoryId, Integer videoId) {
        videoSupplierAdminService.removeCategoryVideo(supplierId, categoryId, videoId);
    }
}
