package com.taoke.course.dto.cms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 推荐资源排序请求
 *
 * @author Fangxinxin
 * @date 2026-06-12 18:00
 */
@Data
public class ReorderRecommendedResourcesRequest {

    @NotBlank
    private String slotCode;

    private Integer categoryId;

    @NotEmpty
    private List<Integer> orderedIds;
}
