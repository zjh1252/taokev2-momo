package com.taoke.user.dto.institutionemployee;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 机构员工信息返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Data
public class InstitutionEmployeeResponse {

    private Integer id;
    private Integer orgId;

    /** 真实姓名 */
    private String realName;

    /** 联系电话 */
    private String contactPhone;

    /** 常用邮箱 */
    private String email;

    /** 多服务城市结构化 JSON 字符串：{@code [{provinceId,cityId,provinceName,cityName}]} */
    private String serviceCities;

    /** 注册培训机构员工合作协议签署时间 */
    private LocalDateTime agreementSignedAt;

    /** 协议版本号 */
    private String agreementVersion;

    /** 职位（legacy） */
    private String position;

    /** 部门（legacy） */
    private String department;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
