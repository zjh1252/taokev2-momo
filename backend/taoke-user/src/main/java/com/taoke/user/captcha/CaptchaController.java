package com.taoke.user.captcha;

import cloud.tianai.captcha.application.ImageCaptchaApplication;
import cloud.tianai.captcha.common.constant.CaptchaTypeConstant;
import cloud.tianai.captcha.common.response.ApiResponse;
import cloud.tianai.captcha.validator.common.model.dto.ImageCaptchaTrack;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import com.taoke.common.security.Public;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 滑块行为验证码接口（tianai-captcha）。
 * <p>
 * 前端官方 tac SDK 直接对接：
 * <ul>
 *   <li>{@code GET /auth/captcha}（requestCaptchaDataUrl）→ 生成滑块，返回 tianai 标准结构</li>
 *   <li>{@code POST /auth/captcha/check}（validCaptchaUrl）→ 提交滑动轨迹校验，
 *       通过后签发一次性 token，前端在后续发短信/登录请求中带上</li>
 * </ul>
 * 返回类型直接用 tianai 的 {@link ApiResponse}，以匹配 tac SDK 期望的响应格式。
 * <p>
 * 注：tianai 1.5.5 的类路径/字段以实际 jar 为准（ImageCaptchaApplication / ImageCaptchaTrack /
 * ApiResponse / CaptchaTypeConstant），如有出入仅需在此文件微调。
 *
 * @author Fangxinxin
 * @date 2026-05-23 15:00
 */
@Tag(name = "行为验证码", description = "滑块验证码生成与校验")
@RestController
@RequiredArgsConstructor
public class CaptchaController {

    private final ImageCaptchaApplication imageCaptchaApplication;
    private final CaptchaTokenStore captchaTokenStore;

    @Public
    @Operation(summary = "生成滑块验证码")
    @PostMapping("/auth/captcha")
    public ApiResponse<?> generate() {
        // tac 前端以 POST 请求生成接口；忽略请求体，固定返回滑块类型
        return imageCaptchaApplication.generateCaptcha(CaptchaTypeConstant.SLIDER);
    }

    @Public
    @Operation(summary = "校验滑块轨迹，通过签发一次性 token")
    @PostMapping("/auth/captcha/check")
    public ApiResponse<?> check(@RequestBody CaptchaCheckRequest request) {
        ApiResponse<?> matching = imageCaptchaApplication.matching(request.getId(), request.getData());
        if (matching == null || !matching.isSuccess()) {
            return matching;
        }
        // 校验通过 → 返回一次性 token（data.token），前端带入后续发短信/登录请求
        return ApiResponse.ofSuccess(java.util.Map.of("token", captchaTokenStore.issue()));
    }

    /** tac SDK 校验请求体：{ id, data:{滑动轨迹} } */
    @Data
    public static class CaptchaCheckRequest {
        private String id;
        private ImageCaptchaTrack data;
    }
}
