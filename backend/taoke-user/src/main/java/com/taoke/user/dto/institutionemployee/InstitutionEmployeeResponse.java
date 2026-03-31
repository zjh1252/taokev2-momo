package com.taoke.user.dto.institutionemployee;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 机构员工信息返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Data
public class InstitutionEmployeeResponse {

    private Integer id;
    private Integer orgId;
    private String position;
    private String department;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
