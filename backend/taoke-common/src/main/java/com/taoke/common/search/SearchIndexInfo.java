package com.taoke.common.search;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 搜索索引管理列表项。
 *
 * @author Fangxinxin
 * @date 2026-07-10 18:00
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchIndexInfo {

    private String name;

    private boolean defaultIndex;

    private Long documentCount;
}
