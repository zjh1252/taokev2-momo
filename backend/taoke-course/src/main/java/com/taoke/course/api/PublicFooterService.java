package com.taoke.course.api;

import com.taoke.course.dto.cms.PublicFooterVO;
import com.taoke.course.dto.cms.StaticPageVO;

/**
 * C 端底部栏与静态页公开接口
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
public interface PublicFooterService {

    PublicFooterVO getPublicFooter();

    StaticPageVO getPublishedPage(String pageCode);
}
