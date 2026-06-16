package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台机构申请列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-09 10:00
 */
@Data
public class AdminInstitutionApplicationVO {

    /** 申请 ID（UserRole 记录 ID，标识每一次入驻申请记录） */
    private Integer id;

    /** 用户 ID */
    private Integer userId;

    /** 机构 ID（user_institutions 正式档案 ID，审核通过后才有值） */
    private Integer institutionId;

    /** 用户手机号 */
    private String phone;

    /** 用户昵称 */
    private String nickname;

    /** 机构名称（来自 institution 档案） */
    private String orgName;

    /** 机构 Logo */
    private String logoUrl;

    /** 联系人姓名 */
    private String contactName;

    /** 联系电话 */
    private String contactPhone;

    /** 申请状态：1=生效，2=待审核，3=已驳回，4=已禁用 */
    private Integer status;

    /** 是否「已生效身份资料重审中」（二次申请） */
    private Boolean reapplying;

    /** 驳回原因 */
    private String rejectReason;

    /** 申请时间 */
    private LocalDateTime createdAt;

    /** 最近提交时间（二次申请后更新） */
    private LocalDateTime updatedAt;

    /** 审核通过时间 */
    private LocalDateTime approvedAt;
}
