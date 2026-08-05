package com.taoke.common.storage.provider;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.ObjectMetadata;
import com.taoke.common.storage.StorageException;
import com.taoke.common.storage.StorageProperties;
import com.taoke.common.storage.StorageService;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

import java.io.InputStream;

/**
 * 阿里云 OSS 存储实现 — 生产环境使用。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Slf4j
public class AliOssStorageService implements StorageService {

    private final OSS ossClient;
    private final String bucket;
    private final String publicDomain;

    public AliOssStorageService(StorageProperties properties) {
        StorageProperties.Oss oss = properties.getOss();
        String endpoint = normalizeEndpoint(oss.getEndpoint());
        this.ossClient = new OSSClientBuilder().build(
                endpoint, oss.getAccessKeyId(), oss.getAccessKeySecret());
        this.bucket = oss.getBucket();
        this.publicDomain = trimTrailingSlash(properties.getPublicDomain());
        if (!StringUtils.hasText(this.publicDomain)) {
            throw new IllegalStateException(
                    "taoke.storage.public-domain 未配置：OSS 上传必须返回 CDN 绝对 URL");
        }
        if (!StringUtils.hasText(oss.getAccessKeyId()) || !StringUtils.hasText(oss.getAccessKeySecret())) {
            throw new IllegalStateException(
                    "OSS 凭据未配置：请设置 OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET");
        }
        log.info("阿里云 OSS 存储初始化完成，bucket: {}, cdn: {}", bucket, publicDomain);
    }

    @Override
    public String upload(String path, InputStream data, long size, String contentType) {
        try {
            String key = trimLeadingSlash(path);
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(size);
            if (StringUtils.hasText(contentType)) {
                metadata.setContentType(contentType);
            }
            ossClient.putObject(bucket, key, data, metadata);
            if (!ossClient.doesObjectExist(bucket, key)) {
                throw new StorageException("aliyun-oss", key, "OSS 上传后对象不存在，请检查 bucket 权限与 CDN 配置");
            }
            log.info("OSS 上传成功: bucket={}, key={}", bucket, key);
            return key;
        } catch (Exception e) {
            throw new StorageException("aliyun-oss", path, "OSS 上传失败", e);
        }
    }

    @Override
    public void delete(String path) {
        try {
            if (!StringUtils.hasText(path)) {
                return;
            }
            String key = trimLeadingSlash(path);
            ossClient.deleteObject(bucket, key);
        } catch (Exception e) {
            log.warn("OSS 删除失败(忽略): {}", path, e);
        }
    }

    @Override
    public String getPublicUrl(String path) {
        if (path == null) {
            return "";
        }
        String key = "/" + trimLeadingSlash(path);
        if (StringUtils.hasText(publicDomain)) {
            return publicDomain + key;
        }
        return key;
    }

    @Override
    public boolean exists(String path) {
        if (!StringUtils.hasText(path)) {
            return false;
        }
        try {
            return ossClient.doesObjectExist(bucket, trimLeadingSlash(path));
        } catch (Exception e) {
            return false;
        }
    }

    @PreDestroy
    public void shutdown() {
        if (ossClient != null) {
            ossClient.shutdown();
        }
    }

    private static String trimLeadingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("^/+", "");
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) {
            return null;
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    /** 兼容老站配置：支持 https://bucket.oss-cn-xxx.aliyuncs.com 或纯 endpoint */
    private static String normalizeEndpoint(String endpoint) {
        if (!StringUtils.hasText(endpoint)) {
            return endpoint;
        }
        String normalized = endpoint.trim();
        if (normalized.startsWith("https://")) {
            normalized = normalized.substring(8);
        } else if (normalized.startsWith("http://")) {
            normalized = normalized.substring(7);
        }
        int ossIndex = normalized.indexOf(".oss-");
        if (ossIndex > 0 && normalized.contains(".aliyuncs.com")) {
            normalized = normalized.substring(ossIndex + 1);
        }
        return normalized;
    }
}
