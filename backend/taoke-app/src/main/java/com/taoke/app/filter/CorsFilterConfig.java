package com.taoke.app.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * 跨域过滤器 — 基于 YAML 配置化，不同环境可设不同策略。
 * <p>
 * dev 环境：{@code allowed-origins: *}（全放开）<br>
 * prod 环境：{@code allowed-origins: https://www.taoke.com}（限定域名）
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Configuration
public class CorsFilterConfig {

    @Value("${taoke.cors.allowed-origins:*}")
    private List<String> allowedOrigins;

    @Value("${taoke.cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private List<String> allowedMethods;

    @Value("${taoke.cors.allowed-headers:*}")
    private List<String> allowedHeaders;

    @Value("${taoke.cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Value("${taoke.cors.max-age:3600}")
    private long maxAge;

    @Bean
    public org.springframework.web.filter.CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(allowedMethods);
        config.setAllowedHeaders(allowedHeaders);
        config.setAllowCredentials(allowCredentials);
        config.setMaxAge(maxAge);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new org.springframework.web.filter.CorsFilter(source);
    }
}
