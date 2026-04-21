package com.taoke.user.dto.venue;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 机构场地保存请求体。
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:00
 */
@Data
public class InstitutionVenueRequest {

    @NotBlank(message = "场地名称不能为空")
    @Size(max = 200)
    private String name;

    private Integer provinceId;

    private Integer cityId;

    private Integer districtId;

    @Size(max = 500)
    private String address;

    private Integer capacity;

    @Size(max = 500)
    private String coverUrl;

    /** 场地多图（最多 9 张），第一张可作为封面回填 coverUrl */
    private List<String> images;

    @Size(max = 2000)
    private String description;

    /** 1=启用，0=停用，未传默认 1 */
    private Integer status;

    private Integer sortOrder;
}
