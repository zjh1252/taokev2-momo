package com.taoke.common.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * Redisson 客户端配置。
 * <p>
 * 仅注册 {@link RedissonClient} 供分布式锁、延迟队列等高级能力使用，
 * 不接管 Spring Data Redis 的 {@code RedisConnectionFactory}，避免影响
 * {@code StringRedisTemplate}/{@code RedisTemplate} 基于 Lettuce 的默认行为。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-03 13:05
 */
@Configuration
@ConditionalOnClass(Redisson.class)
public class RedissonConfig {

    /**
     * 基于 Spring Boot 的 Redis 配置创建 Redisson 客户端。
     *
     * @param redisProperties Spring Boot Redis 配置
     * @return Redisson 客户端
     */
    @Bean(destroyMethod = "shutdown")
    @ConditionalOnMissingBean(RedissonClient.class)
    public RedissonClient redissonClient(RedisProperties redisProperties) {
        Config config = new Config();
        boolean sslEnabled = redisProperties.getSsl() != null && redisProperties.getSsl().isEnabled();
        String protocol = sslEnabled ? "rediss://" : "redis://";
        String address = protocol + redisProperties.getHost() + ":" + redisProperties.getPort();
        var singleServerConfig = config.useSingleServer()
                .setAddress(address)
                .setDatabase(redisProperties.getDatabase());

        if (redisProperties.getTimeout() != null) {
            singleServerConfig.setTimeout((int) redisProperties.getTimeout().toMillis());
        }

        if (StringUtils.hasText(redisProperties.getPassword())) {
            singleServerConfig.setPassword(redisProperties.getPassword());
        }

        return Redisson.create(config);
    }
}
