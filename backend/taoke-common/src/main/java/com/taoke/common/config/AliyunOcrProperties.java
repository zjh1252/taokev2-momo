package com.taoke.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 阿里云 OCR 配置，绑定 {@code taoke.ocr.aliyun.*}。
 *
 * @author Fangxinxin
 * @date 2026-07-07 09:45
 */
@Data
@Component
@ConfigurationProperties(prefix = "taoke.ocr.aliyun")
public class AliyunOcrProperties {

    /** 是否启用 OCR 能力 */
    private boolean enabled = true;

    /** OCR API endpoint */
    private String endpoint = "ocr-api.cn-hangzhou.aliyuncs.com";

    /** AccessKeyId */
    private String accessKeyId = "";

    /** AccessKeySecret */
    private String accessKeySecret = "";

    /** API 超时（毫秒） */
    private Integer timeoutMs = 60000;
}
