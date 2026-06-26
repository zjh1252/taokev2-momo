package com.taoke.user.config;

import com.taoke.user.auth.LoginLockoutProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 认证相关配置装配。
 *
 * @author Fangxinxin
 * @date 2026-06-22 10:00
 */
@Configuration
@EnableConfigurationProperties(LoginLockoutProperties.class)
public class AuthConfig {
}
