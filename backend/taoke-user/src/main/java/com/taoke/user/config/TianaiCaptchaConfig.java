package com.taoke.user.config;

import cloud.tianai.captcha.resource.ResourceStore;
import cloud.tianai.captcha.resource.impl.LocalMemoryResourceStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * tianai-captcha 资源存储配置。
 * <p>
 * 项目存在 Redis 时，tianai 默认把「资源库(背景图/滑块模板)」设为 RedisResourceStore，
 * 但官方在有 Redis 时<b>不会自动把默认资源写入 Redis</b>，导致资源库为空，
 * 生成验证码报 “请求的资源数量超过可用资源总数”。
 * <p>
 * 这里显式提供本地内存资源库 Bean 覆盖之：资源走本地内存（配合
 * {@code captcha.init-default-resource=true} 加载内置图片），Redis 仅用于校验数据缓存。
 * <p>
 * 注：类路径以 tianai 1.5.5 实际 jar 为准（cloud.tianai.captcha.resource.ResourceStore /
 * cloud.tianai.captcha.resource.impl.LocalMemoryResourceStore），如不一致请按 IDE 提示调整 import。
 *
 * @author Fangxinxin
 * @date 2026-05-25 20:30
 */
@Configuration
public class TianaiCaptchaConfig {

    @Bean
    public ResourceStore resourceStore() {
        return new LocalMemoryResourceStore();
    }
}
