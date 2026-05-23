package com.taoke.user.config;

import com.taoke.user.ucenter.UcenterProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * UCenter 账号中心配置装配，启用 {@link UcenterProperties}（taoke.ucenter.*）。
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:00
 */
@Configuration
@EnableConfigurationProperties(UcenterProperties.class)
public class UcenterConfig {
}
