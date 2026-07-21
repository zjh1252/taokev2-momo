package com.taoke.course.dto.cms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新静态页面
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Data
public class UpdateStaticPageRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    private String content;

    private Boolean published;
}
