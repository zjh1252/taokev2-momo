package com.taoke.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * 启用 JPA Auditing，自动填充 @CreatedDate / @LastModifiedDate。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
