package com.taoke.course.dto.video;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 保存录播课供应商请求
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class SaveVideoSupplierRequest {

    @NotNull(message = "用户 ID 不能为空")
    private Integer userId;

    @NotBlank(message = "公司名称不能为空")
    private String companyName;

    private String memberType;

    private Boolean enabled;
}
