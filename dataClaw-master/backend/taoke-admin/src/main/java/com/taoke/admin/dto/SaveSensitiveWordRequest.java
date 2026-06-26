package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新增/编辑敏感词请求
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:00
 */
@Data
public class SaveSensitiveWordRequest {

    @NotBlank(message = "敏感词不能为空")
    @Size(max = 100, message = "敏感词长度不能超过100")
    private String word;

    /** 分类：1=政治敏感, 2=色情低俗, 3=暴力, 4=广告, 5=其他 */
    private Integer category;

    /** 替换文本，默认 *** */
    @Size(max = 100, message = "替换文本长度不能超过100")
    private String replacement;

    /** 是否启用 */
    private Boolean enabled;
}
