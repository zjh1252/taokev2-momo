package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台机构员工申请列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Data
public class AdminInstitutionEmployeeApplicationVO {

    /** UserRole 记录 ID */
    private Integer id;

    /** 用户 ID */
    private Integer userId;

    /** 用户手机号 */
    private String phone;

    /** 用户昵称 */
    private String nickname;

    /** 职位 */
    private String position;

    /** 部门 */
    private String department;

    /** 所属机构名称 */
    private String orgName;

    /** 申请状态：1=生效，2=待审核，3=已驳回，4=已禁用 */
    private Integer status;

    /** 驳回原因 */
    private String rejectReason;

    /** 申请时间 */
    private LocalDateTime createdAt;

    /** 审核通过时间 */
    private LocalDateTime approvedAt;
}
