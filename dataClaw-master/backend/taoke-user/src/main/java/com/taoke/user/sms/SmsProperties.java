package com.taoke.user.sms;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 短信配置属性
 * <p>
 * 绑定 {@code taoke.sms.*} 下的配置项，包括 provider 类型、验证码长度、过期时间，
 * 以及各短信渠道（阿里云、腾讯云）的密钥参数。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
@ConfigurationProperties(prefix = "taoke.sms")
public class SmsProperties {

    /** 短信发送实现：mock / aliyun / tencent */
    private String provider = "mock";

    /** 验证码长度 */
    private int codeLength = 6;

    /** 验证码有效期（分钟） */
    private int expireMinutes = 5;

    /** 阿里云短信配置 */
    private Aliyun aliyun = new Aliyun();

    /** 腾讯云短信配置 */
    private Tencent tencent = new Tencent();

    @Data
    public static class Aliyun {
        private String accessKeyId;
        private String accessKeySecret;
        private String signName;
        private String templateCode;
    }

    @Data
    public static class Tencent {
        private String secretId;
        private String secretKey;
        private String appId;
        private String signName;
        private String templateId;
    }
}
