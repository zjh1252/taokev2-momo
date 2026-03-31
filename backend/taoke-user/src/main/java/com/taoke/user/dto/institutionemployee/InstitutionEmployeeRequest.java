package com.taoke.user.dto.institutionemployee;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存机构员工信息请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Data
public class InstitutionEmployeeRequest {

    /** 所属机构 ID */
    private Integer orgId;

    @Size(max = 64, message = "职位不超过64个字符")
    private String position;

    @Size(max = 64, message = "部门不超过64个字符")
    private String department;
}
