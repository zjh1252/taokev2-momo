package com.taoke.user.dto.trainer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 专家工作经历 DTO（输入/输出复用）
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Data
public class TrainerWorkExperienceDTO {

    private Integer id;

    @NotBlank(message = "单位名称不能为空")
    @Size(max = 200, message = "单位名称不超过200个字符")
    private String companyName;

    @Size(max = 100, message = "职务不超过100个字符")
    private String position;

    @NotNull(message = "开始日期不能为空")
    private LocalDate startDate;

    private LocalDate endDate;

    private String jobDescription;

    private Integer sortOrder = 0;
}
