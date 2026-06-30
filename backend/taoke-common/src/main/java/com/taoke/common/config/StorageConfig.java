package com.taoke.common.config;

import com.taoke.common.storage.StorageProperties;
import com.taoke.common.storage.StorageService;
import com.taoke.common.storage.provider.AliOssStorageService;
import com.taoke.common.storage.provider.LocalStorageService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 存储服务 Bean 装配 — 根据 {@code taoke.storage.provider} 选择实现。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Configuration
public class StorageConfig {

    @Bean
    public StorageService storageService(StorageProperties properties) {
        String provider = properties.getProvider();
        if ("local".equals(provider)) {
            org.slf4j.LoggerFactory.getLogger(StorageConfig.class)
                    .warn("taoke.storage.provider=local：上传文件写入本地磁盘，生产环境请使用 aliyun-oss");
        }
        return switch (provider) {
            case "local" -> new LocalStorageService(properties);
            case "aliyun-oss" -> new AliOssStorageService(properties);
            default -> throw new IllegalArgumentException("不支持的存储提供者: " + provider);
        };
    }
}
