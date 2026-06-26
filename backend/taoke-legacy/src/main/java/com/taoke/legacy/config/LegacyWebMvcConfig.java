package com.taoke.legacy.config;

import com.taoke.legacy.security.LegacySignatureInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 注册 legacy 签名拦截器。
 */
@Configuration
@EnableConfigurationProperties(LegacyApiProperties.class)
@RequiredArgsConstructor
public class LegacyWebMvcConfig implements WebMvcConfigurer {

    private final LegacySignatureInterceptor legacySignatureInterceptor;
    private final LegacyApiProperties legacyApiProperties;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (!legacyApiProperties.isEnabled()) {
            return;
        }
        registry.addInterceptor(legacySignatureInterceptor)
                .addPathPatterns("/api/*.php");
    }
}
