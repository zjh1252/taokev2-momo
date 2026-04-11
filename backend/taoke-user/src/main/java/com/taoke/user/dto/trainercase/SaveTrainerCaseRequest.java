package com.taoke.user.dto.trainercase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 新增/编辑案例请求
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:00
 */
@Data
public class SaveTrainerCaseRequest {

    @NotBlank(message = "案例标题不能为空")
    @Size(max = 200, message = "案例标题不能超过200字")
    private String caseTitle;

    @NotBlank(message = "企业名称不能为空")
    @Size(max = 200, message = "企业名称不能超过200字")
    private String enterpriseName;

    @Size(max = 100, message = "行业不能超过100字")
    private String industry;

    @Size(max = 200, message = "培训主题不能超过200字")
    private String trainingTopic;

    private String trainingEffect;

    private Integer traineeCount;

    private LocalDate trainingDate;

    private String description;

    @Size(max = 500, message = "封面图 URL 不能超过500字")
    private String coverImage;

    private Integer sortOrder;
}
