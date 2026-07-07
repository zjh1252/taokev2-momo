package com.taoke.common.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.config.AiProperties;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 基于 OpenAI 兼容协议（{@code POST /chat/completions}）的 {@link AiChatService} 实现。
 *
 * <p>使用 {@link RestTemplate} 同步调用，超时由 {@link AiProperties#getTimeoutMs()} 控制。
 * 支持任意兼容 OpenAI 协议的网关（OpenAI / Azure OpenAI / 阿里 dashscope-compatible / one-api 等）。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-29 20:00
 */
@Slf4j
@Service
public class OpenAiCompatibleChatService implements AiChatService {

    /** 兜底剥离 markdown 代码块（```json ... ``` 或 ``` ... ```） */
    private static final Pattern CODE_FENCE = Pattern.compile(
            "(?s)```(?:json)?\\s*(\\{.*?\\}|\\[.*?\\])\\s*```", Pattern.CASE_INSENSITIVE);

    private final AiProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OpenAiCompatibleChatService(AiProperties properties,
                                       RestTemplateBuilder restTemplateBuilder,
                                       ObjectProvider<ObjectMapper> objectMapperProvider) {
        this.properties = properties;
        Duration timeout = Duration.ofMillis(properties.getTimeoutMs() == null ? 60000 : properties.getTimeoutMs());
        this.restTemplate = restTemplateBuilder
                .connectTimeout(timeout)
                .readTimeout(timeout)
                .build();
        // 复用 Spring Boot 全局 ObjectMapper，没有时退化到默认
        this.objectMapper = objectMapperProvider.getIfAvailable(ObjectMapper::new);
    }

    @Override
    public boolean isAvailable() {
        return properties.isEnabled()
                && properties.getApiKey() != null
                && !properties.getApiKey().isBlank()
                && properties.getBaseUrl() != null
                && !properties.getBaseUrl().isBlank();
    }

    @Override
    public String chat(String systemPrompt, String userPrompt) {
        ensureAvailable();
        return doChat(systemPrompt, userPrompt, null, false);
    }

    @Override
    public <T> T chatJson(String systemPrompt, String userPrompt, Class<T> type) {
        ensureAvailable();
        // 第一次：要求 JSON 输出
        String content = doChat(systemPrompt, userPrompt, null, true);
        try {
            return objectMapper.readValue(stripJsonFence(content), type);
        } catch (JsonProcessingException firstError) {
            log.warn("AI 返回 JSON 解析失败，进行第二次重试。第一次原始内容: {}", trim(content), firstError);
            // 第二次：在 system prompt 上追加更强的 JSON 约束
            String stricter = (systemPrompt == null ? "" : systemPrompt)
                    + "\n\n[严格要求] 仅输出 JSON，不要任何解释、不要 markdown 代码块标记。";
            content = doChat(stricter, userPrompt, null, true);
            try {
                return objectMapper.readValue(stripJsonFence(content), type);
            } catch (JsonProcessingException secondError) {
                log.error("AI 返回 JSON 二次解析仍失败，最终内容: {}", trim(content), secondError);
                throw new BusinessException(ErrorCode.AI_PARSE_FAILED);
            }
        }
    }

    @Override
    public <T> T chatJsonWithImages(String systemPrompt, String userPrompt, List<AiImageInput> images, Class<T> type) {
        ensureAvailable();
        String content = doChat(systemPrompt, userPrompt, images, true);
        try {
            return objectMapper.readValue(stripJsonFence(content), type);
        } catch (JsonProcessingException firstError) {
            log.warn("AI 多模态返回 JSON 解析失败，进行第二次重试。第一次原始内容: {}", trim(content), firstError);
            String stricter = (systemPrompt == null ? "" : systemPrompt)
                    + "\n\n[严格要求] 仅输出 JSON，不要任何解释、不要 markdown 代码块标记。";
            content = doChat(stricter, userPrompt, images, true);
            try {
                return objectMapper.readValue(stripJsonFence(content), type);
            } catch (JsonProcessingException secondError) {
                log.error("AI 多模态返回 JSON 二次解析仍失败，最终内容: {}", trim(content), secondError);
                throw new BusinessException(ErrorCode.AI_PARSE_FAILED);
            }
        }
    }

    /**
     * 真正的 HTTP 调用。
     *
     * @param systemPrompt 系统提示
     * @param userPrompt   用户输入
     * @param jsonMode     是否走 {@code response_format=json_object}
     */
    private String doChat(String systemPrompt, String userPrompt, List<AiImageInput> images, boolean jsonMode) {
        String url = trimTrailingSlash(properties.getBaseUrl()) + "/chat/completions";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", properties.getModel());
        body.put("temperature", properties.getTemperature());
        Object userContent = buildUserContent(userPrompt, images);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt == null ? "" : systemPrompt),
                Map.of("role", "user", "content", userContent)
        ));
        if (jsonMode) {
            // OpenAI / 部分兼容服务支持；不支持的服务会忽略此字段
            body.put("response_format", Map.of("type", "json_object"));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(properties.getApiKey());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("AI 调用返回非 2xx：status={}, body={}", response.getStatusCode(), trim(response.getBody()));
                throw new BusinessException(ErrorCode.AI_CALL_FAILED);
            }
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            if (contentNode.isMissingNode() || contentNode.isNull()) {
                log.warn("AI 返回结构异常：{}", trim(response.getBody()));
                throw new BusinessException(ErrorCode.AI_CALL_FAILED);
            }
            return contentNode.asText("");
        } catch (BusinessException e) {
            throw e;
        } catch (RestClientException | JsonProcessingException e) {
            log.error("AI 调用异常 url={}", url, e);
            throw new BusinessException(ErrorCode.AI_CALL_FAILED);
        }
    }

    private static Object buildUserContent(String userPrompt, List<AiImageInput> images) {
        if (images == null || images.isEmpty()) {
            return userPrompt == null ? "" : userPrompt;
        }
        List<Map<String, Object>> content = new java.util.ArrayList<>();
        content.add(Map.of("type", "text", "text", userPrompt == null ? "" : userPrompt));
        for (AiImageInput image : images) {
            if (image == null || image.dataUrl() == null || image.dataUrl().isBlank()) {
                continue;
            }
            content.add(Map.of(
                    "type", "image_url",
                    "image_url", Map.of("url", image.dataUrl())
            ));
        }
        return content;
    }

    /** 抛出 AI_NOT_ENABLED 当配置未就绪 */
    private void ensureAvailable() {
        if (!isAvailable()) {
            throw new BusinessException(ErrorCode.AI_NOT_ENABLED);
        }
    }

    /** 兜底剥离 markdown 代码块外壳 */
    static String stripJsonFence(String raw) {
        if (raw == null) {
            return "";
        }
        String trimmed = raw.trim();
        Matcher matcher = CODE_FENCE.matcher(trimmed);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        // 非代码块包裹，但前面有 "JSON:" 之类的前缀，截取到第一个 { / [ 起
        int lBrace = trimmed.indexOf('{');
        int lBracket = trimmed.indexOf('[');
        int start = -1;
        if (lBrace >= 0 && lBracket >= 0) {
            start = Math.min(lBrace, lBracket);
        } else {
            start = Math.max(lBrace, lBracket);
        }
        if (start > 0) {
            return trimmed.substring(start);
        }
        return trimmed;
    }

    private static String trimTrailingSlash(String url) {
        if (url == null) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /** 日志截断防止过长 */
    private static String trim(String s) {
        if (s == null) {
            return "";
        }
        return s.length() > 1000 ? s.substring(0, 1000) + "...(truncated)" : s;
    }
}
