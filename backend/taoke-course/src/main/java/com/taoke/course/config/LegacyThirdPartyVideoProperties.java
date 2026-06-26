package com.taoke.course.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 老站第三方录播（中欧 eceibs、快课 kuaike、宽学网 kuanxue、思酷 scho）签发配置。
 *
 * @author Fangxinxin
 * @date 2026-06-11 10:00
 */
@Data
@ConfigurationProperties(prefix = "taoke.legacy-video")
public class LegacyThirdPartyVideoProperties {

    private Eceibs eceibs = new Eceibs();
    private Kuaike kuaike = new Kuaike();
    private Kuanxue kuanxue = new Kuanxue();
    private Scho scho = new Scho();

    @Data
    public static class Eceibs {
        private boolean enabled = true;
        /** 中欧 API 根地址，需以 / 结尾 */
        private String apiUrl = "http://intest.eceibs.com/";
        private String corpId = "taoke";
        private String apiKey = "sddsintestsdasd";
    }

    @Data
    public static class Kuaike {
        private boolean enabled = true;
        private String apiUrl = "http://t0001.witsharer.com/ws/open/v1";
        private String apiKey = "ebd361b8a48fb2d46471e8";
        private String corpCode = "TK_default";
        private String corpName = "TKW";
    }

    @Data
    public static class Kuanxue {
        private boolean enabled = true;
        /** 宽学 LRM 控制器根地址，需以 / 结尾 */
        private String apiUrl = "http://preview.kuanxue.com/lrm/controller/";
        private String corpId = "taoke";
    }

    @Data
    public static class Scho {
        private boolean enabled = true;
        /** 思酷租赁 API 根地址（无尾斜杠），如 http://test.scho.com.cn */
        private String apiUrl = "http://test.scho.com.cn";
        private String secretKey = "1E904D6E91A01D4A5C86EDE8B13370BE";
    }
}
