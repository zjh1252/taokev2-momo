package com.taoke.course.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 老站第三方录播配置注册。
 *
 * @author Fangxinxin
 * @date 2026-06-11 10:00
 */
@Configuration
@EnableConfigurationProperties(LegacyThirdPartyVideoProperties.class)
public class LegacyThirdPartyVideoConfig {
}
