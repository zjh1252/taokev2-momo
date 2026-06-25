package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 通用角色申请详情视图 — 每个角色后台申请列表的「查看详情」共用。
 *
 * @author Fangxinxin
 * @date 2026-06-25 18:00
 */
@Data
public class AdminApplicationDetailVO {
    /** 申请 ID（UserRole 记录 ID） */
    private Integer id;
    private Integer userId;
    private String phone;
    private String nickname;
    /** 角色编码 */
    private String role;
    /** 角色中文名 */
    private String roleName;
    /** 申请状态：1=生效，2=待审核，3=已驳回，4=已禁用 */
    private Integer status;
    /** 是否「已生效身份资料重审中」 */
    private Boolean reapplying;
    /** 驳回原因 */
    private String rejectReason;
    /** 申请时间 */
    private LocalDateTime createdAt;
    /** 审核通过时间 */
    private LocalDateTime approvedAt;
    /** 角色实体 ID（如 trainerId/institutionId，审核通过后才有值） */
    private Integer entityId;
    /** 申请人名称（trainerName / orgName / companyName 等） */
    private String applicantName;
    /** 完整的表单字段列表 */
    private List<AdminApplicationFieldVO> fields;
}
