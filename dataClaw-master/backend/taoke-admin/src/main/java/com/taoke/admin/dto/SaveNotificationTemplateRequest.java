package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建/编辑通知模板请求体。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
@Data
public class SaveNotificationTemplateRequest {

    @NotBlank(message = "模板编码不能为空")
    private String code;

    private String channel;
    private String lang;
    private String titleTemplate;

    @NotBlank(message = "内容模板不能为空")
    private String contentTemplate;

    private Integer enabled;
    private String remark;
}
