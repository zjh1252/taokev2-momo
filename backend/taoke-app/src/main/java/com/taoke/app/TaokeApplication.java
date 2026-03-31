package com.taoke.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * 淘课网 v2 启动入口
 * <p>
 * scanBasePackages 扫描 com.taoke 下所有子包的 Spring 组件，
 * EnableJpaRepositories / EntityScan 确保各模块的 Repository 和 Entity 被发现。
 */
@SpringBootApplication(scanBasePackages = "com.taoke")
@EnableJpaRepositories(basePackages = "com.taoke")
@EntityScan(basePackages = "com.taoke")
public class TaokeApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaokeApplication.class, args);
    }

}
