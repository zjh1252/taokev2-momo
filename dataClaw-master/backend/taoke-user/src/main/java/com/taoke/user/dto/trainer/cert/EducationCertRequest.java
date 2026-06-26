package com.taoke.user.dto.trainer.cert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 学历认证提交请求（单条记录）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class EducationCertRequest {

    @NotBlank(message = "持证人姓名不能为空")
    @Size(max = 64, message = "持证人姓名不超过64个字符")
    private String holderName;

    @NotBlank(message = "院校名称不能为空")
    @Size(max = 200, message = "院校名称不超过200个字符")
    private String schoolName;

    @NotBlank(message = "所学专业不能为空")
    @Size(max = 100, message = "所学专业不超过100个字符")
    private String major;

    @Size(max = 50, message = "学历不超过50个字符")
    private String degree;

    @NotNull(message = "入学日期不能为空")
    private LocalDate startDate;

    private LocalDate endDate;

    private Integer isGraduated = 1;

    @NotBlank(message = "请上传学历证明文件")
    @Size(max = 500, message = "证明文件 URL 不超过500个字符")
    private String proofFile;
}
