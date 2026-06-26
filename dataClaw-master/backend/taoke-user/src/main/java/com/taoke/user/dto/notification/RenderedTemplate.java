package com.taoke.user.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 模板渲染结果。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
@Data
@AllArgsConstructor
public class RenderedTemplate {
    private String title;
    private String content;
}
