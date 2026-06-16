package com.taoke.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户业务角色视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-01 22:00
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBusinessRoleVO {

    /** 角色编码（如 TRAINER、BUYER） */
    private String roleCode;

    /** 角色状态：1=生效，2=待审核，3=审核驳回，4=已禁用 */
    private Integer status;
}
