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

    /** 对方账号名（登录用户名，可能为空） */
    private String counterpartUsername;

    /** 对方真实姓名（如已实名/已填写） */
    private String counterpartRealName;

    /** 对方手机号 */
    private String counterpartPhone;

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

    /**
     * 是否当前用户是发起方
     * <p>
     * 字段名以小写 {@code if} 开头是有意为之：
     * 若用 {@code iAmInitiator} (I + A 都大写)，Java Beans Introspector
     * 不会将首字母下转，导致 JSON 序列化为 {@code "IAmInitiator"}，
     * 与前端 camelCase 不一致。
     */
    private Boolean ifInitiator;

    /** 创建时间 */
    private LocalDateTime createdAt;

    /** 确认时间 */
    private LocalDateTime confirmedAt;
}
