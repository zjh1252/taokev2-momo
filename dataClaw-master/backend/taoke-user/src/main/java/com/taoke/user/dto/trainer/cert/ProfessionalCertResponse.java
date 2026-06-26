package com.taoke.user.dto.trainer.cert;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 专业认证查询返回。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class ProfessionalCertResponse {

    /** 专业认证附件 URL 列表（已解析为数组） */
    private List<String> files;

    /** NULL=未提交 1=待审核 2=已通过 3=已驳回 */
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
