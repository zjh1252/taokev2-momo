package com.taoke.legacy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * 培训宝 legacy API 配置（对齐老站 common.signature.php）。
 */
@Data
@ConfigurationProperties(prefix = "taoke.legacy-api")
public class LegacyApiProperties {

    /** 是否启用 legacy 兼容层 */
    private boolean enabled = true;

    /** appid → 签名密钥（对齐 PHP $signature_key） */
    private Map<String, String> signatureKeys = new HashMap<>();

    /** appid → 完整出库 URL（对齐 PHP $signature_urls） */
    private Map<String, String> signatureUrls = new HashMap<>();

    /** 淘课主动推送课程库（默认培训宝站点） */
    private PxbOutboundProperties pxbOutbound = new PxbOutboundProperties();

    /** search_course.php 时间戳有效期（秒），老站 7200 */
    private long searchCourseTimestampSkewSeconds = 7200;

    /** 其他 /api/*.php 默认有效期（秒），老站 864000 */
    private long defaultTimestampSkewSeconds = 864000;

    /** 是否为接入商 appid（signature-urls 中配置了非空 URL）。 */
    public boolean isPartnerApp(String appid) {
        if (!StringUtils.hasText(appid)) {
            return false;
        }
        String url = signatureUrls.get(appid.trim());
        return StringUtils.hasText(url);
    }

    /**
     * 解析出库 URL：接入商用 signature-urls 完整地址；否则拼 PXB 默认路径并 http 化（对齐老站 pxbCurl）。
     */
    public String resolveOutboundUrl(String appid) {
        if (isPartnerApp(appid)) {
            return signatureUrls.get(appid.trim()).trim();
        }
        PxbOutboundProperties outbound = pxbOutbound;
        if (!StringUtils.hasText(outbound.getBaseUrl())) {
            return "";
        }
        String base = outbound.getBaseUrl().trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        String path = outbound.getApiPath().trim();
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        String url = base + path;
        if (url.startsWith("https://")) {
            url = "http://" + url.substring("https://".length());
        }
        return url;
    }

    /** 出库签名 appid：显式传入优先，否则 pxb-outbound 默认。 */
    public String resolveOutboundAppId(String appid) {
        if (StringUtils.hasText(appid)) {
            return appid.trim();
        }
        return StringUtils.hasText(pxbOutbound.getAppId()) ? pxbOutbound.getAppId() : "taoke";
    }

    @Data
    public static class PxbOutboundProperties {

        /** 是否推送 saveCourses；false 时跳过（对齐老站 VIDEOCOURSETOPXB=false） */
        private boolean enabled = true;

        /** 培训宝站点根地址，如 http://dev.91pxb.com */
        private String baseUrl = "";

        /** 调用培训宝 API 使用的 appid，老站 outbound 默认 taoke */
        private String appId = "taoke";

        /** 入库接口路径 */
        private String apiPath = "/api/tt_course/add_tt_course.php";

        private long connectTimeoutMs = 10_000;

        private long readTimeoutMs = 30_000;
    }
}
