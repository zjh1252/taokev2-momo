package com.taoke.common.storage;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 存储配置属性，绑定 {@code taoke.storage.*}。
 *
 * @author Fangxinxin
 * @date 2026-03-19
 */
@Data
@Component
@ConfigurationProperties(prefix = "taoke.storage")
public class StorageProperties {

    /** 存储提供者：local / aliyun-oss */
    private String provider = "local";

    /** 物理根目录（local 模式为磁盘路径，OSS 模式为 key 前缀） */
    private String baseDir = "./storage";

    /** 对外访问域名，为空时 URL 以 / 开头 */
    private String publicDomain;

    /** 阿里云 OSS 配置 */
    private Oss oss = new Oss();

    @Data
    public static class Oss {
        private String endpoint;
        private String bucket;
        private String accessKeyId;
        private String accessKeySecret;
        private String region;
    }
}
