package com.taoke.course.service.cms;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.api.FooterService;
import com.taoke.course.dto.cms.*;
import com.taoke.course.entity.cms.FooterConfig;
import com.taoke.course.entity.cms.FooterLink;
import com.taoke.course.entity.cms.StaticPage;
import com.taoke.course.enums.FooterLinkType;
import com.taoke.course.repository.FooterConfigRepository;
import com.taoke.course.repository.FooterLinkRepository;
import com.taoke.course.repository.StaticPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 底部栏 CMS 管理服务实现
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Service
@RequiredArgsConstructor
public class FooterServiceImpl implements FooterService {

    private final FooterConfigRepository footerConfigRepository;
    private final FooterLinkRepository footerLinkRepository;
    private final StaticPageRepository staticPageRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminFooterVO getAdminFooter() {
        AdminFooterVO vo = new AdminFooterVO();
        vo.setConfig(toConfigVO(loadConfig()));
        vo.setSections(groupLinks(footerLinkRepository.findAllByOrderBySectionCodeAscSortOrderDescItemCodeAsc(), true));
        vo.setPages(staticPageRepository.findAll().stream().map(this::toPageVO).toList());
        return vo;
    }

    @Override
    @Transactional
    public FooterConfigVO updateConfig(UpdateFooterConfigRequest request) {
        FooterConfig config = loadConfig();
        config.setBrandTagline(request.getBrandTagline());
        config.setCompanyIntro(request.getCompanyIntro());
        config.setPhone(request.getPhone());
        config.setMainQrImageUrl(request.getMainQrImageUrl());
        config.setCopyrightText(request.getCopyrightText());
        config.setCompanyCopyrightText(request.getCompanyCopyrightText());
        config.setCompanyCopyrightUrl(request.getCompanyCopyrightUrl());
        config.setIcpText(request.getIcpText());
        return toConfigVO(footerConfigRepository.save(config));
    }

    @Override
    @Transactional
    public FooterLinkVO updateLink(String itemCode, UpdateFooterLinkRequest request) {
        FooterLink link = footerLinkRepository.findByItemCode(itemCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "底部链接不存在"));
        validateLinkType(request.getLinkType(), request.getLinkTarget());
        link.setLabel(request.getLabel());
        link.setLinkType(request.getLinkType());
        link.setLinkTarget(request.getLinkTarget());
        link.setQrImageUrl(request.getQrImageUrl());
        if (request.getSortOrder() != null) {
            link.setSortOrder(request.getSortOrder());
        }
        if (request.getEnabled() != null) {
            link.setEnabled(request.getEnabled());
        }
        if (request.getOpenInNewTab() != null) {
            link.setOpenInNewTab(request.getOpenInNewTab());
        }
        return toLinkVO(footerLinkRepository.save(link), true);
    }

    @Override
    @Transactional(readOnly = true)
    public StaticPageVO getPage(String pageCode) {
        return staticPageRepository.findByPageCode(pageCode)
                .map(this::toPageVO)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "静态页面不存在"));
    }

    @Override
    @Transactional
    public StaticPageVO updatePage(String pageCode, UpdateStaticPageRequest request) {
        StaticPage page = staticPageRepository.findByPageCode(pageCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "静态页面不存在"));
        page.setTitle(request.getTitle());
        page.setContent(request.getContent());
        if (request.getPublished() != null) {
            page.setPublished(request.getPublished());
        }
        page.setVersion(page.getVersion() + 1);
        return toPageVO(staticPageRepository.save(page));
    }

    private FooterConfig loadConfig() {
        return footerConfigRepository.findById(1)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "底部配置不存在"));
    }

    private void validateLinkType(String linkType, String linkTarget) {
        try {
            FooterLinkType.valueOf(linkType);
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "无效的链接类型");
        }
        if (FooterLinkType.STATIC_PAGE.name().equals(linkType)
                && (linkTarget == null || linkTarget.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "静态页链接需指定 pageCode");
        }
        if (FooterLinkType.INTERNAL.name().equals(linkType)
                && (linkTarget == null || linkTarget.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "站内链接需指定路由");
        }
        if (FooterLinkType.EXTERNAL.name().equals(linkType)
                && (linkTarget == null || linkTarget.isBlank())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "外链需指定 URL");
        }
    }

    static Map<String, List<FooterLinkVO>> groupLinks(List<FooterLink> links, boolean includeDisabled) {
        return links.stream()
                .filter(link -> includeDisabled || Boolean.TRUE.equals(link.getEnabled()))
                .map(link -> FooterSupport.toLinkVO(link, includeDisabled))
                .collect(Collectors.groupingBy(FooterLinkVO::getSectionCode, LinkedHashMap::new, Collectors.toList()));
    }

    private FooterConfigVO toConfigVO(FooterConfig config) {
        return FooterSupport.toConfigVO(config);
    }

    private FooterLinkVO toLinkVO(FooterLink link, boolean includeDisabled) {
        return FooterSupport.toLinkVO(link, includeDisabled);
    }

    private StaticPageVO toPageVO(StaticPage page) {
        return FooterSupport.toPageVO(page);
    }
}
