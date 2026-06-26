package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台经纪公司申请列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Data
public class AdminEnterpriseAgentApplicationVO {

    /** 申请 ID（UserRole 记录 ID，标识每一次入驻申请记录） */
    private Integer id;
    private Integer userId;
    /** 经纪公司 ID（user_enterprise_agents 正式档案 ID，审核通过后才有值） */
    private Integer enterpriseAgentId;
    private String phone;
    private String nickname;
    private String companyName;
    private String contactName;
    private String contactPhone;
    private Integer status;
    /** 是否「已生效身份资料重审中」（二次申请） */
    private Boolean reapplying;
    private String rejectReason;
    private LocalDateTime createdAt;
    /** 最近提交时间（二次申请后更新） */
    private LocalDateTime updatedAt;
    private LocalDateTime approvedAt;
}
