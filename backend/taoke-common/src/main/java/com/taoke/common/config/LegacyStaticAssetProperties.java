package com.taoke.common.config;

import lombok.Data;

/**
 * 老站静态资源域名（CDN / 主站），由环境变量覆盖，见 {@code backend/.env.example}。
 */
@Data
public class LegacyStaticAssetProperties {

    /**
     * 老站 CDN 根，对应 PHP {@code TAOKE_CDN_SITE}。
     * 环境变量：{@code TAOKE_LEGACY_STATIC_CDN_BASE}
     */
    private String cdnBase = "https://cdn-static.taoke.com/taoke/";

    /**
     * 老站主站根（{@code u/} 路径），对应 PHP {@code TKW_MAIN_SITE}。
     * 环境变量：{@code TAOKE_LEGACY_MAIN_SITE_BASE}
     */
    private String mainSiteBase = "https://www.taoke.com/";
}
