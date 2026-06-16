package com.taoke.app.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

/**
 * 跨域配置 — 基于 YAML 配置化，不同环境可设不同策略。
 * <p>
 * dev 环境：显式列出 localhost 前端源（Next.js 默认 3000/3001）<br>
 * prod 环境：{@code allowed-origins: https://www.taoke.com}（限定域名）
 * <p>
 * 注册为 {@link CorsConfigurationSource} Bean，供 Spring Security 的
 * {@code .cors(Customizer.withDefaults())} 自动集成，确保 CORS 头
 * 在 Security 过滤器链之前生效（含 OPTIONS 预检请求）。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Configuration
public class CorsFilterConfig {

    @Value("${taoke.cors.allowed-origins:*}")
    private List<String> allowedOrigins;

    @Value("${taoke.cors.allowed-methods:GET,POST,PUT,DELETE,PATCH,OPTIONS}")
    private List<String> allowedMethods;

    @Value("${taoke.cors.allowed-headers:*}")
    private List<String> allowedHeaders;

    @Value("${taoke.cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Value("${taoke.cors.max-age:3600}")
    private long maxAge;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = normalizeList(allowedOrigins, List.of("*"));
        if (origins.size() == 1 && CorsConfiguration.ALL.equals(origins.get(0))) {
            // 通配符与 credentials 不能同时使用，Spring 会直接拒绝预检
            config.setAllowedOriginPatterns(List.of(CorsConfiguration.ALL));
            config.setAllowCredentials(false);
        } else {
            config.setAllowedOriginPatterns(origins);
            config.setAllowCredentials(allowCredentials);
        }

        config.setAllowedMethods(normalizeList(allowedMethods,
                List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")));
        config.setAllowedHeaders(normalizeList(allowedHeaders, List.of(CorsConfiguration.ALL)));
        config.setMaxAge(maxAge);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /** 兼容 YAML 标量（{@code *}）与逗号分隔字符串两种写法 */
    private static List<String> normalizeList(List<String> raw, List<String> fallback) {
        if (raw == null || raw.isEmpty()) {
            return fallback;
        }
        if (raw.size() == 1 && StringUtils.hasText(raw.get(0)) && raw.get(0).contains(",")) {
            List<String> split = new ArrayList<>();
            for (String part : raw.get(0).split(",")) {
                if (StringUtils.hasText(part)) {
                    split.add(part.trim());
                }
            }
            return split.isEmpty() ? fallback : split;
        }
        return raw;
    }
}
