package com.taoke.course.dto.cms;

import lombok.Data;

/**
 * 底部全局配置 VO
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Data
public class FooterConfigVO {
    private String brandTagline;
    private String companyIntro;
    private String phone;
    private String mainQrImageUrl;
    private String copyrightText;
    private String companyCopyrightText;
    private String companyCopyrightUrl;
    private String icpText;
}
