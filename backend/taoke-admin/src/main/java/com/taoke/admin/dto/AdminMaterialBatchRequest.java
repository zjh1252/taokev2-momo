package com.taoke.admin.dto;



import jakarta.validation.constraints.NotBlank;

import jakarta.validation.constraints.NotEmpty;

import lombok.Data;



import java.util.List;



/**

 * 批量操作运营素材请求

 *

 * @author Fangxinxin

 * @date 2026-06-15 10:00

 */

@Data

public class AdminMaterialBatchRequest {



    @NotEmpty(message = "请选择素材")

    private List<Integer> ids;



    @NotBlank(message = "操作类型不能为空")

    private String action;

}

