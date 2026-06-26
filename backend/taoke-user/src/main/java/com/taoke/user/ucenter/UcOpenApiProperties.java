package com.taoke.user.ucenter;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * UC OpenAPI 配置（AppToken + ACCESS-TOKEN + AUTH）。
 * <p>
 * 凭据与 {@code taoke.sms.pxb} 共用同一套 appId/appSecret，域名默认 uc.91pxb.com。
 *
 * @author Fangxinxin
 * @date 2026-06-26 14:00
 */
@Data
@ConfigurationProperties(prefix = "taoke.uc.open-api")
public class UcOpenApiProperties {

    /** 是否启用 UC OpenAPI 组织成员对接 */
    private boolean enabled = true;

    /** UC 网关根地址 */
    private String ucSite = "https://uc.91pxb.com";

    private String appId;

    private String appSecret;

    /** token Redis 缓存秒数 */
    private int tokenTtlSeconds = 3600;
}
