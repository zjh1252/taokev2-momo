package com.taoke.user.config;

import com.taoke.user.captcha.CaptchaProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 行为验证码配置装配，启用 {@link CaptchaProperties}（taoke.captcha.*）。
 *
 * @author Fangxinxin
 * @date 2026-05-23 15:00
 */
@Configuration
@EnableConfigurationProperties(CaptchaProperties.class)
public class CaptchaConfig {
}
