package com.taoke.course.dto.video;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 供应商分类分配录播课请求
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class SaveSupplierCategoryVideoRequest {

    @NotEmpty(message = "录播课列表不能为空")
    private List<CategoryVideoItem> videos;

    @Data
    public static class CategoryVideoItem {

        private Integer videoId;

        private Integer sortOrder;
    }
}
