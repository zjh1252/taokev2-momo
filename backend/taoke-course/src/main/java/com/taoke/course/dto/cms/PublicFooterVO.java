package com.taoke.course.dto.cms;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * C 端 Footer 聚合数据
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Data
public class PublicFooterVO {
    private FooterConfigVO config;
    private Map<String, List<FooterLinkVO>> sections;
}
