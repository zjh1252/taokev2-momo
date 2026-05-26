package com.taoke.user.sms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * 老淘课网短信网关（uc.91pxb.com）真实发送实现。
 * <p>
 * 移植自老站 {@code AliSendSms}：先调 {@code /app/AppToken/Get} 取 token（缓存到 Redis），
 * 再调 {@code /app/Helper/SendSms}（请求头 {@code ACCESS-TOKEN} + {@code AUTH}）发送验证码。
 * 通过 {@code taoke.sms.provider=pxb} 启用。
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:00
 */
@Slf4j
public class PxbGatewaySmsProvider implements SmsProvider {

    private static final String TOKEN_REDIS_KEY = "taoke:sms:pxb:token";
    private static final String TOKEN_PATH = "/app/AppToken/Get";
    private static final String SEND_PATH = "/app/Helper/SendSms";

    private final SmsProperties.Pxb config;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public PxbGatewaySmsProvider(SmsProperties smsProperties,
                                 StringRedisTemplate redisTemplate,
                                 ObjectMapper objectMapper) {
        this.config = smsProperties.getPxb();
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void send(String phone, String code) {
        // 最多 2 次：首轮用 Redis 缓存的 token；若网关返回 token 失效（"AccessToken无效"等），
        // 清缓存并重新申请 token 后重试 1 次。其他错误直接抛出，不重试。
        for (int attempt = 0; attempt < 2; attempt++) {
            String token = getToken();
            try {
                ObjectNode messageData = objectMapper.createObjectNode();
                messageData.put("code", code);

                ObjectNode body = objectMapper.createObjectNode();
                body.put("access_type", String.valueOf(config.getAccessType()));
                body.put("template_code", config.getTemplateCode());
                body.set("message_data", messageData);
                body.put("mobile", phone);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(trimSlash(config.getUcSite()) + SEND_PATH))
                        .timeout(Duration.ofSeconds(10))
                        .header("Content-Type", "application/json")
                        .header("ACCESS-TOKEN", token)
                        .header("AUTH", String.valueOf(config.getAuth()))
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() != 200) {
                    log.warn("[PXB-SMS] 发送失败 phone={} httpStatus={} resp={}", phone, response.statusCode(), response.body());
                    throw new BusinessException(ErrorCode.SMS_SEND_FAILED);
                }
                // 网关返回结构未必含 err 字段；老站发送时也未校验 err，故仅当显式 err!=0 才视为失败
                JsonNode json = objectMapper.readTree(response.body());
                int err = json.path("err").asInt(0);
                if (err != 0) {
                    // 提取网关返回的具体原因（多为发送服务方限流/号码异常 / token 失效），细化错误提示
                    String reason = firstNonBlank(
                            json.path("msg").asText(null),
                            json.path("message").asText(null),
                            json.path("data").asText(null));
                    // 命中 token 失效：清 Redis 缓存，循环进入下一轮强制重刷 token 后重发
                    if (attempt == 0 && isTokenInvalidReason(reason)) {
                        log.warn("[PXB-SMS] AccessToken 失效，清缓存后重刷重试 phone={} reason={}", phone, reason);
                        redisTemplate.delete(TOKEN_REDIS_KEY);
                        continue;
                    }
                    log.warn("[PXB-SMS] 发送失败 phone={} err={} reason={} resp={}", phone, err, reason, response.body());
                    throw (reason != null)
                            ? new BusinessException(ErrorCode.SMS_SEND_FAILED, "短信发送失败：" + reason)
                            : new BusinessException(ErrorCode.SMS_SEND_FAILED);
                }
                log.info("[PXB-SMS] 验证码已发送 phone={} attempt={} resp={}", phone, attempt, response.body());
                return;
            } catch (BusinessException e) {
                throw e;
            } catch (Exception e) {
                log.error("[PXB-SMS] 发送异常 phone={}", phone, e);
                throw new BusinessException(ErrorCode.SMS_SEND_FAILED);
            }
        }
    }

    /**
     * 判断网关返回的 reason 是否属于 token 失效场景。
     * 老站网关常见话术："AccessToken无效"，统一用小写包含 "token" 关键字匹配，
     * 兼容 "access token expired"、"token失效" 等可能变体。
     */
    private static boolean isTokenInvalidReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return false;
        }
        return reason.toLowerCase().contains("token");
    }

    /**
     * 获取网关 token，优先取 Redis 缓存；缺失则远程获取并回写缓存。
     */
    private String getToken() {
        String cached = redisTemplate.opsForValue().get(TOKEN_REDIS_KEY);
        if (cached != null && !cached.isBlank()) {
            return cached;
        }
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("appId", config.getAppId());
            body.put("appSecret", config.getAppSecret());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(trimSlash(config.getUcSite()) + TOKEN_PATH))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                log.warn("[PXB-SMS] 取 token 失败 httpStatus={} resp={}", response.statusCode(), response.body());
                throw new BusinessException(ErrorCode.SMS_SEND_FAILED);
            }
            JsonNode json = objectMapper.readTree(response.body());
            if (json.path("err").asInt(-1) != 0) {
                log.warn("[PXB-SMS] 取 token 失败 resp={}", response.body());
                throw new BusinessException(ErrorCode.SMS_SEND_FAILED);
            }
            String token = json.path("data").asText("");
            if (token.isBlank()) {
                throw new BusinessException(ErrorCode.SMS_SEND_FAILED);
            }
            redisTemplate.opsForValue().set(TOKEN_REDIS_KEY, token, config.getTokenTtlSeconds(), TimeUnit.SECONDS);
            return token;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[PXB-SMS] 取 token 异常", e);
            throw new BusinessException(ErrorCode.SMS_SEND_FAILED);
        }
    }

    private static String trimSlash(String s) {
        if (s == null) {
            return "";
        }
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    /** 返回首个非空白字符串，全部为空则返回 null。 */
    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank() && !"null".equals(v)) {
                return v.trim();
            }
        }
        return null;
    }
}
