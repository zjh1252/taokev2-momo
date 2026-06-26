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
        this.ossClient = new OSSClientBuilder().build(
                oss.getEndpoint(), oss.getAccessKeyId(), oss.getAccessKeySecret());
        this.bucket = oss.getBucket();
        this.publicDomain = trimTrailingSlash(properties.getPublicDomain());
        log.info("阿里云 OSS 存储初始化完成，bucket: {}", bucket);
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
            log.debug("OSS 上传成功: {}", key);
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
}
