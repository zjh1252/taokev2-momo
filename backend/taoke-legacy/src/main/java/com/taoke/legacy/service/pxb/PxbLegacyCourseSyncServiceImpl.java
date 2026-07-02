package com.taoke.legacy.service.pxb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.course.api.PxbLegacyCourseSyncException;
import com.taoke.course.api.PxbLegacyCourseSyncService;
import com.taoke.course.dto.pxb.PxbLegacyCourseSyncCommand;
import com.taoke.course.dto.pxb.PxbLegacyCourseSyncResult;
import com.taoke.legacy.config.LegacyApiProperties;
import com.taoke.legacy.security.LegacySignatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 复刻老站 pxb_tt_course.pxbCurl → 培训宝 add_tt_course.php?opt=saveCourses。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PxbLegacyCourseSyncServiceImpl implements PxbLegacyCourseSyncService {

    private static final String OPT_SAVE_COURSES = "saveCourses";
    private static final int CTYPE_VIDEO = 3;
    private static final int LOG_BODY_MAX = 500;

    private final LegacyApiProperties properties;
    private final LegacySignatureService signatureService;
    private final ObjectMapper objectMapper;

    @Override
    public PxbLegacyCourseSyncResult syncVideosToPxb(PxbLegacyCourseSyncCommand command) {
        LegacyApiProperties.PxbOutboundProperties outbound = properties.getPxbOutbound();
        String appId = properties.resolveOutboundAppId(command.getAppid());
        String url = properties.resolveOutboundUrl(appId);
        if (!StringUtils.hasText(url)) {
            url = null;
        }

        PxbLegacyCourseSyncResult.PxbLegacyCourseSyncResultBuilder base = PxbLegacyCourseSyncResult.builder()
                .appid(appId)
                .uid(command.getPxbUid())
                .videoIds(command.getVideoIds())
                .pxbRootId(command.getPxbRootId())
                .rootCompanyId(command.getRootCompanyId())
                .isIncludePaper(command.getIsIncludePaper())
                .url(url);

        if (!outbound.isEnabled()) {
            String reason = "PXB 出库未启用（taoke.legacy-api.pxb-outbound.enabled=false）";
            log.warn("PXB saveCourses skipped: {} uid={} videos={}", reason, command.getPxbUid(), command.getVideoIds());
            return base.pushed(false).skipped(true).skipReason(reason).build();
        }
        if (command.getPxbUid() <= 0) {
            throw new PxbLegacyCourseSyncException("培训宝 uid 无效，无法入库课程");
        }
        if (command.getVideoIds() == null || command.getVideoIds().isEmpty()) {
            throw new PxbLegacyCourseSyncException("订单无可用视频，无法入库培训宝课程库");
        }
        if (!StringUtils.hasText(url)) {
            throw new PxbLegacyCourseSyncException(
                    "未配置出库地址：接入商请配置 taoke.legacy-api.signature-urls，培训宝请配置 pxb-outbound.base-url");
        }

        long timestamp = System.currentTimeMillis() / 1000;
        String signature = signatureService.sign(appId, timestamp, OPT_SAVE_COURSES);

        Map<String, String> form = new LinkedHashMap<>();
        form.put("uid", String.valueOf(command.getPxbUid()));
        form.put("opt", OPT_SAVE_COURSES);
        form.put("appid", appId);
        form.put("timetamp", String.valueOf(timestamp));
        form.put("signature", signature);
        form.put("ctype", String.valueOf(CTYPE_VIDEO));
        form.put("save_data", command.getVideoIds().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",")));
        form.put("is_include_paper", String.valueOf(command.getIsIncludePaper()));
        form.put("copy_root_id", String.valueOf(command.getCopyRootId()));
        form.put("root_company_id", String.valueOf(command.getRootCompanyId()));
        form.put("pxb_root_id", String.valueOf(command.getPxbRootId()));
        if (command.getPackagesRelation() != null) {
            command.getPackagesRelation().forEach((videoId, packageId) ->
                    form.put("packages_relation[" + videoId + "]", String.valueOf(packageId)));
        }

        String body = encodeForm(form);
        log.info("PXB saveCourses POST url={} appid={} uid={} root_company_id={} pxb_root_id={} is_include_paper={} videos={} packages_relation={}",
                url, appId, command.getPxbUid(), command.getRootCompanyId(), command.getPxbRootId(),
                command.getIsIncludePaper(), command.getVideoIds(), command.getPackagesRelation());

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(outbound.getConnectTimeoutMs()))
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(outbound.getReadTimeoutMs()))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();
            log.info("PXB saveCourses response url={} http={} body={}",
                    url, response.statusCode(), truncate(responseBody, LOG_BODY_MAX));
            validateResponse(response.statusCode(), responseBody);
            return base
                    .pushed(true)
                    .skipped(false)
                    .httpStatus(response.statusCode())
                    .pxbResponse(truncate(responseBody, LOG_BODY_MAX))
                    .build();
        } catch (PxbLegacyCourseSyncException e) {
            log.error("PXB saveCourses failed url={} appid={} uid={} videos={}: {}",
                    url, appId, command.getPxbUid(), command.getVideoIds(), e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("PXB saveCourses error url={} appid={} uid={} videos={}",
                    url, appId, command.getPxbUid(), command.getVideoIds(), e);
            throw new PxbLegacyCourseSyncException("调用培训宝 saveCourses 失败: " + e.getMessage(), e);
        }
    }

    private static String encodeForm(Map<String, String> form) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : form.entrySet()) {
            if (sb.length() > 0) {
                sb.append('&');
            }
            sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
            sb.append('=');
            sb.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        return sb.toString();
    }

    private void validateResponse(int statusCode, String body) {
        if (statusCode != 200) {
            throw new PxbLegacyCourseSyncException("培训宝 saveCourses HTTP " + statusCode + ": " + truncate(body, LOG_BODY_MAX));
        }
        if ("Access Denied".equalsIgnoreCase(body != null ? body.trim() : "")) {
            throw new PxbLegacyCourseSyncException("培训宝 saveCourses 鉴权失败 Access Denied");
        }
        if (!StringUtils.hasText(body)) {
            throw new PxbLegacyCourseSyncException("培训宝 saveCourses 响应为空");
        }
        try {
            PxbSaveCoursesResponse parsed = objectMapper.readValue(body, PxbSaveCoursesResponse.class);
            if (parsed.isSuccess()) {
                return;
            }
            String msg = parsed.msg != null ? parsed.msg : body;
            throw new PxbLegacyCourseSyncException("培训宝 saveCourses 失败: " + truncate(msg, LOG_BODY_MAX));
        } catch (PxbLegacyCourseSyncException e) {
            throw e;
        } catch (Exception e) {
            throw new PxbLegacyCourseSyncException(
                    "培训宝 saveCourses 响应非 JSON 或 isok/is_ok 不为 true: " + truncate(body, LOG_BODY_MAX), e);
        }
    }

    /** 供单测：解析 saveCourses 响应是否成功（PXB ajaxSuccess 用 isok，部分环境用 is_ok）。 */
    static boolean isSaveCoursesResponseSuccess(String body, ObjectMapper objectMapper) throws Exception {
        return objectMapper.readValue(body, PxbSaveCoursesResponse.class).isSuccess();
    }

    private static String truncate(String body, int maxLen) {
        if (body == null) {
            return "";
        }
        return body.length() > maxLen ? body.substring(0, maxLen) + "..." : body;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PxbSaveCoursesResponse {
        /** PXB ajaxSuccess 标准字段 */
        @JsonProperty("isok")
        private Boolean isok;
        /** 少数环境使用 is_ok */
        @JsonProperty("is_ok")
        private Boolean isOkLegacy;
        private String msg;

        boolean isSuccess() {
            return Boolean.TRUE.equals(isok) || Boolean.TRUE.equals(isOkLegacy);
        }
    }
}
