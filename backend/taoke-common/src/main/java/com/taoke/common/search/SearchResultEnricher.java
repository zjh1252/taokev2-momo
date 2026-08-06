package com.taoke.common.search;

import java.util.List;
import java.util.Map;

/**
 * 搜索结果补全器。
 * <p>用于在 ES 返回后按业务域批量补齐旧索引缺失的展示字段。</p>
 *
 * @author Fangxinxin
 * @date 2026-08-05 20:05
 */
public interface SearchResultEnricher {

    /**
     * 原地补全搜索结果。
     *
     * @param rows 可变搜索结果列表
     */
    void enrich(List<Map<String, Object>> rows);
}
