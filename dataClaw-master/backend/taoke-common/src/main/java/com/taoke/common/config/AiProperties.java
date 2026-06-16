package com.taoke.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AI 服务配置 — 绑定 {@code taoke.ai.*}。
 *
 * <p>与 OpenAI 兼容协议（chat completions）的对接配置：base-url、api-key、model 等。
 * 当 {@link #enabled} 为 false 或 {@link #apiKey} 为空时，AI 调用会返回
 * {@link com.taoke.common.exception.ErrorCode#AI_NOT_ENABLED}。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-29 20:00
 */
@Data
@Component
@ConfigurationProperties(prefix = "taoke.ai")
public class AiProperties {

    /** 是否启用 AI 能力 */
    private boolean enabled = false;

    /** OpenAI 兼容服务的 base-url（形如 https://api.openai.com/v1） */
    private String baseUrl = "";

    /** API 密钥（Bearer Token） */
    private String apiKey = "";

    /** 模型名（如 gpt-4o-mini / qwen-plus 等） */
    private String model = "gpt-4o-mini";

    /** 采样温度，越低越确定性 */
    private Double temperature = 0.2;

    /** HTTP 超时（毫秒） */
    private Integer timeoutMs = 60000;

    /** 文本输入最大字符数，超出会做前段 + 末段截取，避免 token 爆 */
    private Integer maxInputChars = 50000;
}
