package com.taoke.user.captcha;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * 行为验证码（滑块）开关与策略配置。
 * <p>
 * 绑定 {@code taoke.captcha.*}。{@link #enabled} 关闭时不强制任何滑块校验，
 * 便于前端接入完成前分阶段联调；前端接好后置为 true 正式启用。
 *
 * @author Fangxinxin
 * @date 2026-05-23 15:00
 */
@Data
@ConfigurationProperties(prefix = "taoke.captcha")
public class CaptchaProperties {

    /** 是否启用滑块验证卡点（发短信、后台登录、C 端密码登录错 1 次后） */
    private boolean enabled = false;

    /** C 端账号密码登录，失败多少次后要求滑块（默认 1） */
    private int loginFailThreshold = 1;

    /** 滑块背景图列表。默认按 classpath 解析，可写多张随机使用。 */
    private List<String> sliderBackgroundImages = new ArrayList<>();
}
