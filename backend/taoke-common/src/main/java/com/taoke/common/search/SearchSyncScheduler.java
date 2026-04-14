package com.taoke.common.search;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * ES 文档定时同步调度器 — 基于 {@code updatedAt} 增量同步。
 * <p>
 * 每个 {@link DocumentSyncProvider} 的最近同步时间记录在 Redis 中
 * （key: {@code search:sync:{docType}}），应用重启后从 Redis 恢复，不做全量重建。
 * <p>
 * Redis 中无对应 key 表示该 docType 从未被重建过，调度器直接跳过，
 * 等管理员通过 Admin API 手动触发全量重建后自动接管增量同步。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Slf4j
@Component
@ConditionalOnClass(ElasticsearchClient.class)
@RequiredArgsConstructor
public class SearchSyncScheduler {

    private static final String SYNC_KEY_PREFIX = "search:sync:";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final List<DocumentSyncProvider> providers;
    private final SearchIndexService indexService;
    private final StringRedisTemplate stringRedisTemplate;
    private final ElasticsearchProperties properties;

    @Scheduled(fixedDelayString = "${taoke.elasticsearch.sync-interval:10000}")
    public void syncAll() {
        for (DocumentSyncProvider provider : providers) {
            try {
                syncProvider(provider);
            } catch (Exception e) {
                log.error("同步失败: docType={}", provider.getDocType(), e);
            }
        }
    }

    private void syncProvider(DocumentSyncProvider provider) {
        String docType = provider.getDocType();
        String redisKey = SYNC_KEY_PREFIX + docType;

        String lastSyncStr = stringRedisTemplate.opsForValue().get(redisKey);
        if (lastSyncStr == null) {
            // 从未重建过，跳过增量同步
            return;
        }

        LocalDateTime lastSyncTime = LocalDateTime.parse(lastSyncStr, FORMATTER);
        LocalDateTime now = LocalDateTime.now();

        // 增量写入
        List<? extends BaseDocument> updated = provider.fetchUpdatedSince(lastSyncTime);
        if (!updated.isEmpty()) {
            indexService.bulkIndex(updated);
            log.info("增量同步写入: docType={}, count={}", docType, updated.size());
        }

        // 增量删除（下架、驳回等）
        List<Integer> removed = provider.fetchRemovedSince(lastSyncTime);
        if (!removed.isEmpty()) {
            indexService.bulkDelete(docType, removed);
            log.info("增量同步删除: docType={}, count={}", docType, removed.size());
        }

        // 更新同步时间
        stringRedisTemplate.opsForValue().set(redisKey, now.format(FORMATTER));
    }

    /**
     * 全量重建指定 docType 到指定索引，完成后写 Redis 同步时间戳
     *
     * @param provider    文档提供者
     * @param targetIndex 目标索引（null 则使用默认索引）
     */
    public void fullReindex(DocumentSyncProvider provider, String targetIndex) {
        String index = (targetIndex != null && !targetIndex.isBlank())
                ? targetIndex : properties.getIndexName();
        String docType = provider.getDocType();

        log.info("开始全量重建: docType={}, targetIndex={}", docType, index);
        LocalDateTime now = LocalDateTime.now();

        List<? extends BaseDocument> all = provider.fetchAll();
        if (!all.isEmpty()) {
            indexService.bulkIndex(index, all);
        }

        // 写入同步时间，后续定时任务自动接管增量
        String redisKey = SYNC_KEY_PREFIX + docType;
        stringRedisTemplate.opsForValue().set(redisKey, now.format(FORMATTER));

        log.info("全量重建完成: docType={}, count={}, targetIndex={}", docType, all.size(), index);
    }

    /**
     * 根据 docType 查找对应的 provider
     */
    public DocumentSyncProvider getProvider(String docType) {
        return providers.stream()
                .filter(p -> p.getDocType().equals(docType))
                .findFirst()
                .orElse(null);
    }

    /**
     * 获取所有已注册的 provider
     */
    public List<DocumentSyncProvider> getProviders() {
        return providers;
    }
}
