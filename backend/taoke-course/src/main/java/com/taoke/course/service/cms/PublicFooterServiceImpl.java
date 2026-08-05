package com.taoke.course.service.cms;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.api.PublicFooterService;
import com.taoke.course.dto.cms.FooterConfigVO;
import com.taoke.course.dto.cms.PublicFooterVO;
import com.taoke.course.dto.cms.StaticPageVO;
import com.taoke.course.entity.cms.FooterConfig;
import com.taoke.course.repository.FooterConfigRepository;
import com.taoke.course.repository.FooterLinkRepository;
import com.taoke.course.repository.StaticPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * C 端底部栏公开服务实现
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Service
@RequiredArgsConstructor
public class PublicFooterServiceImpl implements PublicFooterService {

    private final FooterConfigRepository footerConfigRepository;
    private final FooterLinkRepository footerLinkRepository;
    private final StaticPageRepository staticPageRepository;

    @Override
    @Transactional(readOnly = true)
    public PublicFooterVO getPublicFooter() {
        FooterConfig config = footerConfigRepository.findById(1)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "底部配置不存在"));
        PublicFooterVO vo = new PublicFooterVO();
        vo.setConfig(FooterSupport.toConfigVO(config));
        vo.setSections(FooterServiceImpl.groupLinks(
                footerLinkRepository.findAllByEnabledTrueOrderBySectionCodeAscSortOrderDescItemCodeAsc(),
                false));
        return vo;
    }

    @Override
    @Transactional(readOnly = true)
    public StaticPageVO getPublishedPage(String pageCode) {
        return staticPageRepository.findByPageCode(pageCode)
                .filter(page -> Boolean.TRUE.equals(page.getPublished()))
                .map(FooterSupport::toPageVO)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "页面不存在或未发布"));
    }
}
