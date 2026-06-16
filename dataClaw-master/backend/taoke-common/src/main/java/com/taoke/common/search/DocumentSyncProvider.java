package com.taoke.common.search;

import java.time.LocalDateTime;
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
}
