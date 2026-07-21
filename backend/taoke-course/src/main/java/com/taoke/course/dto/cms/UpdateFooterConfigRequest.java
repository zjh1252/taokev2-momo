package com.taoke.course.dto.cms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新底部全局配置
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Data
public class UpdateFooterConfigRequest {

    @NotBlank
    @Size(max = 200)
    private String brandTagline;

    private String companyIntro;

    @NotBlank
    @Size(max = 50)
    private String phone;

    @Size(max = 500)
    private String mainQrImageUrl;

    @NotBlank
    @Size(max = 500)
    private String copyrightText;

    @NotBlank
    @Size(max = 200)
    private String companyCopyrightText;

    @Size(max = 500)
    private String companyCopyrightUrl;

    @NotBlank
    @Size(max = 200)
    private String icpText;
}
