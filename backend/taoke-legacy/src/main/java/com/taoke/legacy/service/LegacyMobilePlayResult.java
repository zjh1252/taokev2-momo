package com.taoke.legacy.service;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

/**
 * taokevideo player 响应：JSON 或 supplier HTML。
 */
@Getter
@Builder
public class LegacyMobilePlayResult {

    public enum Kind {
        JSON,
        HTML
    }

    private final Kind kind;
    private final Map<String, Object> jsonBody;
    private final String html;
    private final String contentType;

    public static LegacyMobilePlayResult json(Map<String, Object> body) {
        return LegacyMobilePlayResult.builder()
                .kind(Kind.JSON)
                .jsonBody(body)
                .contentType("application/json")
                .build();
    }

    public static LegacyMobilePlayResult html(String html) {
        return LegacyMobilePlayResult.builder()
                .kind(Kind.HTML)
                .html(html)
                .contentType("text/html;charset=UTF-8")
                .build();
    }
}
