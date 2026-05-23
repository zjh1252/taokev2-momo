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

    /** 短信发送实现：mock / pxb（老站网关）/ aliyun / tencent */
    private String provider = "mock";

    /** 验证码长度 */
    private int codeLength = 6;

    /** 验证码有效期（分钟） */
    private int expireMinutes = 5;

    /** 老站短信网关（uc.91pxb.com）配置 */
    private Pxb pxb = new Pxb();

    /** 阿里云短信配置 */
    private Aliyun aliyun = new Aliyun();

    /** 腾讯云短信配置 */
    private Tencent tencent = new Tencent();

    /**
     * 老淘课网短信网关（移植自 AliSendSms）。
     * 取 token：POST {ucSite}/app/AppToken/Get，发送：POST {ucSite}/app/Helper/SendSms。
     */
    @Data
    public static class Pxb {
        /** 网关根地址，如 http://uc.91pxb.com */
        private String ucSite = "http://uc.91pxb.com";
        /** 应用 ID */
        private String appId;
        /** 应用密钥 */
        private String appSecret;
        /** 接入类型（淘课网=109） */
        private int accessType = 109;
        /** 短信模板编码（淘课网验证码模板） */
        private String templateCode;
        /** 鉴权头 AUTH 值 */
        private int auth = 44;
        /** token 缓存秒数 */
        private int tokenTtlSeconds = 7000;
    }

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
