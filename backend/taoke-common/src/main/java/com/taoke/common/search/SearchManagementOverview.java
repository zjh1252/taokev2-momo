package com.taoke.common.search;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 后台全文搜索管理概览。
 *
 * @author Fangxinxin
 * @date 2026-07-10 18:00
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchManagementOverview {

    private String defaultIndex;

    private List<SearchIndexInfo> indices;

    private List<String> docTypes;
}
