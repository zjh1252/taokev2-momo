package com.taoke.common.search;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Elasticsearch 连接配置属性，绑定 {@code taoke.elasticsearch.*}
 *
 * @author Fangxinxin
 * @date 2026-04-14 17:00
 */
@Data
@ConfigurationProperties(prefix = "taoke.elasticsearch")
public class ElasticsearchProperties {

    /**
     * ES 节点地址列表，如 {@code http://localhost:9200}
     */
    private List<String> uris = List.of("http://localhost:9200");

    /**
     * 认证用户名（Basic Auth）
     */
    private String username;

    /**
     * 认证密码（Basic Auth）
     */
    private String password;

    /**
     * 连接超时（毫秒）
     */
    private int connectTimeout = 5000;

    /**
     * 套接字读取超时（毫秒）
     */
    private int socketTimeout = 30000;

    /**
     * 默认索引名
     */
    private String indexName = "taokev2app";

    /**
     * 定时同步间隔（毫秒），默认 10 秒
     */
    private long syncInterval = 10000;

    /**
     * 启动时若 Redis 无同步水位且索引为空，是否自动全量重建（建议仅 dev 开启）
     */
    private boolean autoReindexOnStartup = false;

    /**
     * 全量重建 / 批量写入时每批文档数，避免单次 bulk 过大被 ES 拒绝或撑爆内存
     */
    private int reindexBatchSize = 500;
}
