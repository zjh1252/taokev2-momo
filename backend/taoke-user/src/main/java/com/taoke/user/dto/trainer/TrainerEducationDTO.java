package com.taoke.user.dto.trainer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 专家教育经历 DTO（输入/输出复用）
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Data
public class TrainerEducationDTO {

    private Integer id;

    @NotBlank(message = "学校名称不能为空")
    @Size(max = 200, message = "学校名称不超过200个字符")
    private String schoolName;

    @Size(max = 100, message = "专业不超过100个字符")
    private String major;

    @Size(max = 50, message = "学历不超过50个字符")
    private String degree;

    @NotNull(message = "入学日期不能为空")
    private LocalDate startDate;

    private LocalDate endDate;

    private Integer isGraduated = 1;

    private Integer sortOrder = 0;
}
