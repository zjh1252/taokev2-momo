package com.taoke.user.auth;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 密码登录失败锁定策略（taoke.auth.login-lockout.*）。
 *
 * @author Fangxinxin
 * @date 2026-06-22 10:00
 */
@Data
@ConfigurationProperties(prefix = "taoke.auth.login-lockout")
public class LoginLockoutProperties {

    /** 是否启用连续密码错误锁定 */
    private boolean enabled = true;

    /** 连续密码错误多少次后锁定账号 */
    private int maxFailures = 5;

    /** 锁定时长（分钟） */
    private int lockDurationMinutes = 30;
}
