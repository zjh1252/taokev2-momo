package com.taoke.course.dto.cms;

import lombok.Data;

/**
 * 底部链接 VO
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Data
public class FooterLinkVO {
    private Integer id;
    private String sectionCode;
    private String itemCode;
    private String label;
    private String linkType;
    private String linkTarget;
    private String href;
    private String iconKey;
    private String qrImageUrl;
    private Integer sortOrder;
    private Boolean enabled;
    private Boolean openInNewTab;
}
