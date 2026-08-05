package com.taoke.course.service.cms;

import com.taoke.course.dto.cms.FooterConfigVO;
import com.taoke.course.dto.cms.FooterLinkVO;
import com.taoke.course.dto.cms.StaticPageVO;
import com.taoke.course.entity.cms.FooterConfig;
import com.taoke.course.entity.cms.FooterLink;
import com.taoke.course.entity.cms.StaticPage;
import com.taoke.course.enums.FooterLinkType;

/**
 * Footer 映射与 href 构造
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
public final class FooterSupport {

    private FooterSupport() {
    }

    static FooterConfigVO toConfigVO(FooterConfig config) {
        FooterConfigVO vo = new FooterConfigVO();
        vo.setBrandTagline(config.getBrandTagline());
        vo.setCompanyIntro(config.getCompanyIntro());
        vo.setPhone(config.getPhone());
        vo.setMainQrImageUrl(config.getMainQrImageUrl());
        vo.setCopyrightText(config.getCopyrightText());
        vo.setCompanyCopyrightText(config.getCompanyCopyrightText());
        vo.setCompanyCopyrightUrl(config.getCompanyCopyrightUrl());
        vo.setIcpText(config.getIcpText());
        return vo;
    }

    static FooterLinkVO toLinkVO(FooterLink link, boolean includeDisabled) {
        FooterLinkVO vo = new FooterLinkVO();
        vo.setId(link.getId());
        vo.setSectionCode(link.getSectionCode());
        vo.setItemCode(link.getItemCode());
        vo.setLabel(link.getLabel());
        vo.setLinkType(link.getLinkType());
        vo.setLinkTarget(link.getLinkTarget());
        vo.setHref(resolveHref(link));
        vo.setIconKey(link.getIconKey());
        vo.setQrImageUrl(link.getQrImageUrl());
        vo.setSortOrder(link.getSortOrder());
        vo.setEnabled(link.getEnabled());
        vo.setOpenInNewTab(link.getOpenInNewTab());
        if (!includeDisabled && !Boolean.TRUE.equals(link.getEnabled())) {
            return vo;
        }
        return vo;
    }

    static StaticPageVO toPageVO(StaticPage page) {
        StaticPageVO vo = new StaticPageVO();
        vo.setId(page.getId());
        vo.setPageCode(page.getPageCode());
        vo.setTitle(page.getTitle());
        vo.setContent(page.getContent());
        vo.setPublished(page.getPublished());
        vo.setVersion(page.getVersion());
        return vo;
    }

    public static String resolveHref(FooterLink link) {
        if (!Boolean.TRUE.equals(link.getEnabled())) {
            return null;
        }
        FooterLinkType type;
        try {
            type = FooterLinkType.valueOf(link.getLinkType());
        } catch (IllegalArgumentException ex) {
            return null;
        }
        return switch (type) {
            case INTERNAL -> link.getLinkTarget();
            case STATIC_PAGE -> "/pages/" + toPageSlug(link.getLinkTarget());
            case EXTERNAL -> link.getLinkTarget();
            case NONE -> null;
        };
    }

    public static String toPageSlug(String pageCode) {
        if (pageCode == null || pageCode.isBlank()) {
            return "";
        }
        return pageCode.toLowerCase().replace('_', '-');
    }

    public static String toPageCode(String slug) {
        if (slug == null || slug.isBlank()) {
            return "";
        }
        return slug.toUpperCase().replace('-', '_');
    }
}
