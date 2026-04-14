package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台机构员工列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Data
public class AdminInstitutionEmployeeVO {

    private Integer id;
    private Integer userId;

    /** 所属机构 ID */
    private Integer orgId;

    /** 所属机构名称（关联查询） */
    private String orgName;

    /** 职位 */
    private String position;

    /** 部门 */
    private String department;

    private LocalDateTime createdAt;
}
