package com.taoke.course.dto.cms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新底部链接项
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Data
public class UpdateFooterLinkRequest {

    @NotBlank
    @Size(max = 100)
    private String label;

    @NotBlank
    @Size(max = 20)
    private String linkType;

    @Size(max = 500)
    private String linkTarget;

    @Size(max = 500)
    private String qrImageUrl;

    private Integer sortOrder;

    private Boolean enabled;

    private Boolean openInNewTab;
}
