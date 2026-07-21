package com.taoke.course.dto.cms;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 后台 Footer 管理聚合数据
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Data
public class AdminFooterVO {
    private FooterConfigVO config;
    private Map<String, List<FooterLinkVO>> sections;
    private List<StaticPageVO> pages;
}
