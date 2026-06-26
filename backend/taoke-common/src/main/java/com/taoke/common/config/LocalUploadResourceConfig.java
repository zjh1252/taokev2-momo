package com.taoke.common.config;

import com.taoke.common.storage.StorageDirectoryResolver;
import com.taoke.common.storage.StorageProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

/**
 * 本地存储模式下暴露 {@code /uploads/**} 静态资源，供前端预览已上传文件。
 *
 * <p>dev 环境文件写入 {@code taoke.storage.base-dir}（通常为 frontend/public），
 * 前端通过 Next.js rewrite 或直连 API 域名访问。</p>
 *
 * @author Fangxinxin
 * @date 2026-06-11 16:30
 */
@Configuration
@ConditionalOnProperty(name = "taoke.storage.provider", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
public class LocalUploadResourceConfig implements WebMvcConfigurer {

    private final StorageProperties storageProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path baseDir = StorageDirectoryResolver.resolve(storageProperties.getBaseDir());
        String location = baseDir.toUri().toString();
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
