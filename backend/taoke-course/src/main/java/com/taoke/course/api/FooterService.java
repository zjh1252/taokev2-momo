package com.taoke.course.api;

import com.taoke.course.dto.cms.*;

/**
 * 底部栏 CMS 管理接口
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
public interface FooterService {

    AdminFooterVO getAdminFooter();

    FooterConfigVO updateConfig(UpdateFooterConfigRequest request);

    FooterLinkVO updateLink(String itemCode, UpdateFooterLinkRequest request);

    StaticPageVO getPage(String pageCode);

    StaticPageVO updatePage(String pageCode, UpdateStaticPageRequest request);
}
