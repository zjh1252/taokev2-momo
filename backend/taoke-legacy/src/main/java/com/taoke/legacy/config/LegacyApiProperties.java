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

    /** appid → 签名密钥 */
    private Map<String, String> signatureKeys = defaultKeys();

    /** search_course.php 时间戳有效期（秒），老站 7200 */
    private long searchCourseTimestampSkewSeconds = 7200;

    /** 其他 /api/*.php 默认有效期（秒），老站 864000 */
    private long defaultTimestampSkewSeconds = 864000;

    private static Map<String, String> defaultKeys() {
        Map<String, String> keys = new HashMap<>();
        keys.put("pxb", "fn234gyty4542");
        keys.put("taoke", "adfdsrve34243");
        return keys;
    }
}
