package com.taoke.common.search;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * 文档同步提供者 — 每种业务实体实现此接口，供定时调度器统一调用。
 * <p>
 * 实现类只负责查 DB、构建 {@link BaseDocument}，不直接操作 ES。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
public interface DocumentSyncProvider {

    /**
     * 文档类型标识，如 "course"、"trainer"，与 {@link BaseDocument#getDocType()} 一致
     */
    String getDocType();

    /**
     * 查询指定时间之后有更新、且状态为可索引的记录，构建文档列表
     *
     * @param since 上次同步时间
     * @return 需要写入 ES 的文档
     */
    List<? extends BaseDocument> fetchUpdatedSince(LocalDateTime since);

    /**
     * 查询指定时间之后有更新、但状态已不可索引的记录 ID（下架、驳回、删除等），
     * 用于从 ES 中删除
     *
     * @param since 上次同步时间
     * @return 需要从 ES 删除的业务主键列表
     */
    List<Integer> fetchRemovedSince(LocalDateTime since);

    /**
     * 查询所有可索引的记录，用于全量重建
     */
    List<? extends BaseDocument> fetchAll();

    /**
     * 分页拉取可索引文档（page 从 0 开始）。
     * <p>
     * 全量重建应优先走本方法，避免 {@link #fetchAll()} 一次加载过大结果集导致 OOM。
     * 默认实现基于 {@link #fetchAll()} 切片，仅适用于小数据量；大数据量 provider 必须覆盖。
     */
    default List<? extends BaseDocument> fetchPage(int page, int size) {
        if (page < 0 || size <= 0) {
            return List.of();
        }
        List<? extends BaseDocument> all = fetchAll();
        int from = page * size;
        if (from >= all.size()) {
            return List.of();
        }
        return all.subList(from, Math.min(from + size, all.size()));
    }

    /**
     * Fetch the next deterministic reindex batch after a committed business ID.
     * Large providers should override this with a keyset query.
     */
    default List<? extends BaseDocument> fetchAfterId(int lastId, int size) {
        if (size <= 0) {
            return List.of();
        }
        return fetchAll().stream()
                .filter(document -> document.getId() != null && document.getId() > lastId)
                .sorted(Comparator.comparing(BaseDocument::getId))
                .limit(size)
                .toList();
    }
}
