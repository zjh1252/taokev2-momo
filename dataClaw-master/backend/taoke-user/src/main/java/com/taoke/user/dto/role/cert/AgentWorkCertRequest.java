package com.taoke.user.dto.role.cert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * 经纪人工作认证提交请求（单条记录）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class AgentWorkCertRequest {

    @NotBlank(message = "单位名称不能为空")
    @Size(max = 200, message = "单位名称不超过200个字符")
    private String companyName;

    @NotBlank(message = "担任职务不能为空")
    @Size(max = 100, message = "担任职务不超过100个字符")
    private String position;

    @NotNull(message = "起始日期不能为空")
    private LocalDate startDate;

    private LocalDate endDate;

    private String jobDescription;

    @NotBlank(message = "请上传工作证明文件")
    @Size(max = 500, message = "证明文件 URL 不超过500个字符")
    private String proofFile;
}
