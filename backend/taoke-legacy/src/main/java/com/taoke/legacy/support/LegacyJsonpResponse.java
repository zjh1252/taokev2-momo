package com.taoke.legacy.support;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

/**
 * taokevideo JSONP 响应（fetch-jsonp 通过 script 标签加载，需 JavaScript Content-Type）。
 */
public final class LegacyJsonpResponse {

    private static final Pattern SAFE_CALLBACK = Pattern.compile("^[a-zA-Z_$][\\w$]*$");
    private static final MediaType JAVASCRIPT_UTF8 =
            MediaType.parseMediaType("application/javascript;charset=UTF-8");

    private LegacyJsonpResponse() {
    }

    public static boolean isValidCallback(String callback) {
        return StringUtils.hasText(callback) && SAFE_CALLBACK.matcher(callback).matches();
    }

    public static ResponseEntity<String> ok(String jsonBody, String callback) {
        if (isValidCallback(callback)) {
            return ResponseEntity.ok()
                    .contentType(JAVASCRIPT_UTF8)
                    .body(callback + "(" + jsonBody + ")");
        }
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(jsonBody);
    }
}
