package com.taoke.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 淘课网 v2 应用启动入口。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
// 扫描 com.taoke 下组件；EnableJpaRepositories / EntityScan 注册各模块 Repository 与实体
//标签不展示：老站 tags 单独渲染，新站 expertise_tags 未展示
//18117252701
@SpringBootApplication(scanBasePackages = "com.taoke")
@EnableJpaRepositories(basePackages = "com.taoke")
@EntityScan(basePackages = "com.taoke")
@EnableScheduling
public class TaokeApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaokeApplication.class, args);
    }

}