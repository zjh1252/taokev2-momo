package com.taoke.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 淘课网 v2 启动入口
 * <p>
 * scanBasePackages 扫描 com.taoke 下所有子包，
 * 确保各业务模块（user/supply/course/content）的 Bean 都能被发现。
 */
@SpringBootApplication(scanBasePackages = "com.taoke")
public class TaokeApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaokeApplication.class, args);
    }

}
