package com.taoke.user.dto.binding;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 发起绑定请求。
 *
 * @author Fangxinxin
 * @date 2026-04-21 14:50
 */
@Data
public class InitiateBindingRequest {

    /** 绑定类型 */
    @NotNull
    private BindingType bindingType;

    /**
     * 目标用户 ID。
     * <ul>
     *   <li>AGENT_TRAINER / ASSISTANT_TRAINER / INSTITUTION_TRAINER / ENTERPRISE_AGENT_TRAINER：目标专家 user_id</li>
     *   <li>INSTITUTION_EMPLOYEE：目标员工 user_id（由机构发起）</li>
     *   <li>ENTERPRISE_AGENT_MEMBER：目标经纪人 user_id（由经纪公司发起）</li>
     * </ul>
     */
    @NotNull
    private Integer targetUserId;

    /** 备注 */
    private String note;

    /** UC 成员 lookup 记录 ID（可选，绑定成功后回填关联） */
    private Integer ucMemberLinkId;
}
