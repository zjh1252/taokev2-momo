package com.taoke.legacy.security;

import com.taoke.legacy.config.LegacyApiProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;

/**
 * 拦截 /api/*.php，校验 appid + timetamp + opt + signature。
 */
@Component
@RequiredArgsConstructor
public class LegacySignatureInterceptor implements HandlerInterceptor {

    private final LegacySignatureService signatureService;
    private final LegacyApiProperties properties;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if (!properties.isEnabled()) {
            deny(response, "Access Denied");
            return false;
        }

        String apiFile = extractApiFile(request.getRequestURI());
        String appid = trimParam(request, "appid");
        String opt = trimParam(request, "opt");
        String signature = trimParam(request, "signature");
        long timestamp = parseLong(trimParam(request, "timetamp"));

        if (!signatureService.verify(appid, timestamp, opt, signature)) {
            deny(response, "Access Denied");
            return false;
        }
        if (!signatureService.isTimestampValid(apiFile, timestamp)) {
            deny(response, "Access Denied");
            return false;
        }

        request.setAttribute(LegacyApiContext.ATTR,
                new LegacyApiContext(apiFile, appid, opt, timestamp));
        return true;
    }

    private static String extractApiFile(String uri) {
        if (uri == null) {
            return "";
        }
        int slash = uri.lastIndexOf('/');
        return slash >= 0 ? uri.substring(slash + 1) : uri;
    }

    private static String trimParam(HttpServletRequest request, String name) {
        String value = request.getParameter(name);
        return value != null ? value.trim() : "";
    }

    private static long parseLong(String value) {
        if (!StringUtils.hasText(value)) {
            return 0L;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private static void deny(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpServletResponse.SC_OK);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.TEXT_PLAIN_VALUE);
        response.getWriter().write(message);
    }
}
