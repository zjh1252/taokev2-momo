package com.taoke.user.dto.institution;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * 机构列表页筛选项聚合 — 擅长领域 / 擅长行业 的去重计数。
 *
 * @author Fangxinxin
 * @date 2026-06-02 18:30
 */
@Data
public class InstitutionFacetsResponse {

    /** 擅长领域（机构类别）计数，按数量倒序 */
    private List<CategoryCount> specialties;

    /** 擅长行业计数，按数量倒序 */
    private List<CategoryCount> industries;

    @Data
    @AllArgsConstructor
    public static class CategoryCount {
        private String name;
        private long count;
    }
}
