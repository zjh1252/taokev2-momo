package com.taoke.course.dto.cms;

import lombok.Data;

/**
 * 静态页面 VO
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Data
public class StaticPageVO {
    private Integer id;
    private String pageCode;
    private String title;
    private String content;
    private Boolean published;
    private Integer version;
}
