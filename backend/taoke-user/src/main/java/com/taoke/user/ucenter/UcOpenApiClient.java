package com.taoke.user.ucenter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * UC OpenAPI 客户端：AppToken 获取 + 带 AUTH 租户头的 POST 调用。
 * <p>
 * 模式与培训宝 {@code AccessUCPostApi}、淘课 {@code PxbGatewaySmsProvider} 一致。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Slf4j
@Component
public class UcOpenApiClient {

    private static final String TOKEN_REDIS_KEY = "taoke:uc:open-api:token";
    private static final String TOKEN_PATH = "/app/AppToken/Get";

    private final UcOpenApiProperties properties;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public UcOpenApiClient(UcOpenApiProperties properties,
                           StringRedisTemplate redisTemplate,
                           ObjectMapper objectMapper) {
        this.properties = properties;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public boolean isEnabled() {
        return properties.isEnabled()
                && properties.getAppId() != null && !properties.getAppId().isBlank()
                && properties.getAppSecret() != null && !properties.getAppSecret().isBlank();
    }

    /**
     * POST 调用 UC OpenAPI，自动附带 ACCESS-TOKEN 与 AUTH。
     */
    public JsonNode post(String path, ObjectNode body, int ucPRootId) {
        return doPost(path, body, ucPRootId);
    }

    /**
     * POST 调用 UC OpenAPI，仅附带 ACCESS-TOKEN（无 AUTH，用于解析 root_company_id 等引导接口）。
     */
    public JsonNode postAppOnly(String path, ObjectNode body) {
        return doPost(path, body, null);
    }

    private JsonNode doPost(String path, ObjectNode body, Integer ucPRootId) {
        if (!isEnabled()) {
            throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "UC OpenAPI 未配置");
        }
        for (int attempt = 0; attempt < 2; attempt++) {
            String token = getToken();
            try {
                HttpRequest.Builder builder = HttpRequest.newBuilder()
                        .uri(URI.create(trimSlash(properties.getUcSite()) + path))
                        .timeout(Duration.ofSeconds(15))
                        .header("Content-Type", "application/json")
                        .header("ACCESS-TOKEN", token);
                if (ucPRootId != null && ucPRootId > 0) {
                    builder.header("AUTH", String.valueOf(ucPRootId));
                }
                HttpRequest request = builder
                        .POST(HttpRequest.BodyPublishers.ofString(
                                objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() != 200) {
                    log.warn("[UC-API] HTTP 失败 path={} status={} body={}", path, response.statusCode(), response.body());
                    throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "UC 接口调用失败");
                }
                JsonNode json = objectMapper.readTree(response.body());
                int err = json.path("err").asInt(0);
                if (err == 40013 || err == 40014) {
                    if (attempt == 0) {
                        redisTemplate.delete(TOKEN_REDIS_KEY);
                        continue;
                    }
                }
                if (err != 0) {
                    String msg = firstNonBlank(
                            json.path("msg").asText(null),
                            json.path("message").asText(null),
                            json.path("data").asText(null));
                    log.warn("[UC-API] 业务失败 path={} err={} msg={}", path, err, msg);
                    throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, msg != null ? msg : "UC 接口返回错误");
                }
                return json.path("data");
            } catch (BusinessException e) {
                throw e;
            } catch (Exception e) {
                log.error("[UC-API] 调用异常 path={}", path, e);
                throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "UC 接口调用异常");
            }
        }
        throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "UC 接口调用失败");
    }

    public ObjectNode emptyBody() {
        return objectMapper.createObjectNode();
    }

    private String getToken() {
        String cached = redisTemplate.opsForValue().get(TOKEN_REDIS_KEY);
        if (cached != null && !cached.isBlank()) {
            return cached;
        }
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("appId", properties.getAppId());
            body.put("appSecret", properties.getAppSecret());
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(trimSlash(properties.getUcSite()) + TOKEN_PATH))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "UC Token 获取失败");
            }
            JsonNode json = objectMapper.readTree(response.body());
            if (json.path("err").asInt(-1) != 0) {
                throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "UC Token 获取失败");
            }
            String token = json.path("data").asText("");
            if (token.isBlank()) {
                throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "UC Token 为空");
            }
            redisTemplate.opsForValue().set(TOKEN_REDIS_KEY, token, properties.getTokenTtlSeconds(), TimeUnit.SECONDS);
            return token;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[UC-API] 取 token 异常", e);
            throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "UC Token 获取异常");
        }
    }

    private static String trimSlash(String s) {
        if (s == null) {
            return "";
        }
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank() && !"null".equals(v)) {
                return v.trim();
            }
        }
        return null;
    }
}
