package com.taoke.user.dto.trainer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 专家荣誉资质 DTO（输入/输出复用）
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Data
public class TrainerHonorDTO {

    private Integer id;

    @NotBlank(message = "荣誉名称不能为空")
    @Size(max = 200, message = "荣誉名称不超过200个字符")
    private String honorName;

    @Size(max = 500, message = "图片 URL 不超过500个字符")
    private String honorImage;

    @Size(max = 200, message = "颁发机构不超过200个字符")
    private String issuingAuthority;

    private LocalDate issuedAt;

    private String description;

    private Integer sortOrder = 0;
}
