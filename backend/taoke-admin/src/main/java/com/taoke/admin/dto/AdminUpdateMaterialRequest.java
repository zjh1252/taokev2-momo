package com.taoke.admin.dto;



import lombok.Data;



/**

 * 更新运营素材请求

 *

 * @author Fangxinxin

 * @date 2026-06-15 10:00

 */

@Data

public class AdminUpdateMaterialRequest {



    private String name;

    private String url;

    private String category;

    private String scene;

    private Boolean enabled;

    private Boolean isDefault;

}

