package com.taoke.admin.dto;



import lombok.Data;



import java.time.LocalDateTime;



/**

 * 运营素材视图

 *

 * @author Fangxinxin

 * @date 2026-06-12 16:00

 */

@Data

public class AdminMaterialVO {



    private Integer id;

    private String materialType;

    private String name;

    private String url;

    private String category;

    private String scene;

    private Boolean enabled;

    private Boolean isDefault;

    private Integer usageCount;

    private LocalDateTime createdAt;

}

