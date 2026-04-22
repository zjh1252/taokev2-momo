package com.taoke.user.dto.binding;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 绑定关系展示对象。供「我的代理」、「待我确认」、「我代管的专家」、「机构-我的专家/我的员工」等列表统一使用。
 *
 * @author Fangxinxin
 * @date 2026-04-21 14:50
 */
@Data
public class BindingItemResponse {

    /** 绑定记录 ID */
    private Integer id;

    /** 绑定类型 */
    private BindingType bindingType;

    /** 状态 1=ACTIVE 2=PENDING 3=UNBOUND 4=REJECTED */
    private Integer status;

    /** 状态文案 */
    private String statusLabel;

    /** 对方用户 ID */
    private Integer counterpartUserId;

    /** 对方业务角色 code，如 TRAINER / AGENT / INSTITUTION ... */
    private String counterpartRole;

    /** 对方业务角色文案 */
    private String counterpartRoleLabel;

    /** 对方昵称 */
    private String counterpartNickname;

    /** 对方头像 */
    private String counterpartAvatarUrl;

    /** 对方机构/公司名（机构、经纪公司适用） */
    private String counterpartOrgName;

    /** 备注 */
    private String note;

    /** 拒绝理由（status=REJECTED） */
    private String rejectReason;

    /** 发起方用户 ID */
    private Integer initiatorUserId;

    /** 是否当前用户是发起方 */
    private Boolean iAmInitiator;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 确认时间 */
    private LocalDateTime confirmedAt;
}
