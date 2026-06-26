package com.taoke.common.service;

import com.taoke.common.config.LegacyStaticAssetProperties;
import com.taoke.common.util.LegacyStaticAssetUrls;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 老站静态资源 URL 解析（读取环境变量配置，供 Legacy / User 等模块复用）。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LegacyStaticAssetUrlResolver {

    private final LegacyStaticAssetProperties properties;

    @PostConstruct
    void logConfiguredBases() {
        log.info("Legacy static asset CDN base: {}, main site base: {}",
                properties.getCdnBase(), properties.getMainSiteBase());
    }

    public String resolve(String path) {
        return LegacyStaticAssetUrls.resolve(path, properties.getCdnBase(), properties.getMainSiteBase());
    }
}
