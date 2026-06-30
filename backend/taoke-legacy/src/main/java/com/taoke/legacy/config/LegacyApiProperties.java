package com.taoke.legacy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

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

    /** appid → 签名密钥（在 application.yaml / 环境变量中配置） */
    private Map<String, String> signatureKeys = new HashMap<>();

    /** 淘课主动推送培训宝课程库 */
    private PxbOutboundProperties pxbOutbound = new PxbOutboundProperties();

    /** search_course.php 时间戳有效期（秒），老站 7200 */
    private long searchCourseTimestampSkewSeconds = 7200;

    /** 其他 /api/*.php 默认有效期（秒），老站 864000 */
    private long defaultTimestampSkewSeconds = 864000;

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
