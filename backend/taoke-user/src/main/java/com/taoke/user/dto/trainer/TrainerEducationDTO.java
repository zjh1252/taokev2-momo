package com.taoke.user.dto.trainer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 专家教育经历 DTO（输入/输出复用）
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Data
public class TrainerEducationDTO {

    private Integer id;

    /** 持证人姓名（学历文凭上的姓名） */
    @Size(max = 64, message = "持证人姓名不超过64个字符")
    private String holderName;

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

    /** 证明文件 URL（学历证书照片） */
    @Size(max = 500, message = "证明文件 URL 不超过500个字符")
    private String proofFile;

    /** 审核状态：1=待审核 2=已通过 3=已驳回（保存接口忽略，仅用于回显） */
    private Integer status;

    /** 驳回原因（仅回显） */
    private String rejectReason;

    /** 最近一次审核时间（仅回显） */
    private LocalDateTime auditedAt;

    private Integer sortOrder = 0;
}
