package com.taoke.admin.dto;



import jakarta.validation.constraints.NotBlank;

import lombok.Data;



/**

 * 创建运营素材请求

 *

 * @author Fangxinxin

 * @date 2026-06-12 16:00

 */

@Data

public class AdminCreateMaterialRequest {



    @NotBlank(message = "素材类型不能为空")

    private String materialType = "COVER";



    private String name;



    @NotBlank(message = "素材 URL 不能为空")

    private String url;



    private String category = "其它";



    private String scene = "GENERAL";



    private Boolean enabled = true;



    private Boolean isDefault = false;

}

