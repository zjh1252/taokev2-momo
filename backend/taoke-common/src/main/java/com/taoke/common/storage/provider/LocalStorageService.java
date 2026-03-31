package com.taoke.common.storage.provider;

import com.taoke.common.storage.StorageException;
import com.taoke.common.storage.StorageProperties;
import com.taoke.common.storage.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * 本地磁盘存储实现 — 开发阶段使用。
 * <p>
 * 文件存储在 {@code taoke.storage.base-dir} 指定的目录下。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Slf4j
public class LocalStorageService implements StorageService {

    private final Path baseDir;
    private final String publicDomain;

    public LocalStorageService(StorageProperties properties) {
        this.baseDir = Path.of(properties.getBaseDir()).toAbsolutePath().normalize();
        this.publicDomain = trimTrailingSlash(properties.getPublicDomain());
        try {
            Files.createDirectories(this.baseDir);
        } catch (IOException e) {
            throw new StorageException("local", properties.getBaseDir(), "无法创建存储根目录", e);
        }
        log.info("本地存储初始化完成，根目录: {}", this.baseDir);
    }

    @Override
    public String upload(String path, InputStream data, long size, String contentType) {
        try {
            String normalized = trimSlashes(path);
            Path target = baseDir.resolve(normalized).normalize();
            if (!target.startsWith(baseDir)) {
                throw new StorageException("local", normalized, "非法路径，超出存储目录");
            }
            Files.createDirectories(target.getParent());
            Files.copy(data, target, StandardCopyOption.REPLACE_EXISTING);
            log.debug("本地存储写入: {}", normalized);
            return normalized;
        } catch (IOException e) {
            throw new StorageException("local", path, "本地存储上传失败", e);
        }
    }

    @Override
    public void delete(String path) {
        try {
            if (!StringUtils.hasText(path)) {
                return;
            }
            Path target = baseDir.resolve(trimSlashes(path)).normalize();
            if (!target.startsWith(baseDir)) {
                log.warn("本地存储删除被拒绝，路径越界: {}", path);
                return;
            }
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("本地存储删除失败(忽略): {}", path, e);
        }
    }

    @Override
    public String getPublicUrl(String path) {
        if (path == null) {
            return "";
        }
        String normalized = "/" + trimSlashes(path);
        if (StringUtils.hasText(publicDomain)) {
            return publicDomain + normalized;
        }
        return normalized;
    }

    @Override
    public boolean exists(String path) {
        if (!StringUtils.hasText(path)) {
            return false;
        }
        Path target = baseDir.resolve(trimSlashes(path)).normalize();
        return Files.exists(target);
    }

    private static String trimSlashes(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("^/+", "").replaceAll("/+$", "");
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) {
            return null;
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
