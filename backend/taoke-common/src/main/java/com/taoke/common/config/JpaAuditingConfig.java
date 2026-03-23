package com.taoke.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * 启用 JPA Auditing，自动填充 @CreatedDate / @LastModifiedDate
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
