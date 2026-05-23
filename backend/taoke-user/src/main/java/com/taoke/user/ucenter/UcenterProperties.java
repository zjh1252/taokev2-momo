package com.taoke.user.ucenter;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * UCenter 账号中心接入配置。
 * <p>
 * 绑定 {@code taoke.ucenter.*}。开关 {@link #enabled} 关闭时，登录/注册/改密走新站本地流程；
 * 开启时这些操作改由 UCenter（appid=2）远程校验。所有调用走 HTTP API（{@link #apiUrl}/index.php），
 * 适配新站与 UCenter 不同机房部署。
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:00
 */
@Data
@ConfigurationProperties(prefix = "taoke.ucenter")
public class UcenterProperties {

    /** 是否启用 UCenter 账号中心；false=走新站本地登录/注册/改密 */
    private boolean enabled = false;

    /** UCenter API 根地址（不含 /index.php），如 http://shequ.taoke.com/uc_server */
    private String apiUrl = "";

    /** 与 UCenter 约定的通信密钥（UC_KEY），双方必须一致 */
    private String key = "";

    /** 当前应用在 UCenter 的应用 ID（淘课网为 2） */
    private int appid = 2;

    /** UCenter 字符集 */
    private String charset = "utf-8";

    /** HTTP 调用超时（毫秒） */
    private int timeoutMs = 10000;

    /** 调用 UCenter 时使用的固定 User-Agent（与 authcode 中的 agent 摘要保持一致） */
    private String userAgent = "Taoke-UCenter-Client/2.0";
}
