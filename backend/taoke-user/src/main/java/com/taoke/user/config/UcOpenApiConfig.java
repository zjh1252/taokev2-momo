package com.taoke.user.ucenter;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * UC OpenAPI 配置装配。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Configuration
@EnableConfigurationProperties(UcOpenApiProperties.class)
public class UcOpenApiConfig {
}
