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
     * </ul>
     */
    @NotNull
    private Integer targetUserId;

    /** 备注 */
    private String note;
}
