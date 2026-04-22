package com.taoke.user.dto.institutionemployee;

import com.taoke.user.dto.common.ServiceCityItem;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 保存机构员工信息请求 — 培训机构员工角色申请 / 资料更新统一入参。
 *
 * <p>本期表单仅采集 realName / contactPhone / email / serviceCities / orgId / 协议；
 * 旧字段 position / department 保留可选不删，避免破坏历史调用。</p>
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Data
public class InstitutionEmployeeRequest {

    /** 所属机构 ID */
    private Integer orgId;

    /** 真实姓名 */
    @Size(max = 64, message = "真实姓名不超过64个字符")
    private String realName;

    /** 联系电话 */
    @Size(max = 20, message = "联系电话不超过20个字符")
    private String contactPhone;

    /** 常用邮箱 */
    @Email(message = "邮箱格式不正确")
    @Size(max = 128, message = "邮箱不超过128个字符")
    private String email;

    /** 多服务城市（2 级联动，省+市） */
    private List<ServiceCityItem> serviceCities;

    /** 是否已勾选《淘课网注册培训机构员工合作协议》 */
    private Boolean agreementSigned;

    /** 协议版本号；默认 v1 */
    @Size(max = 32, message = "协议版本号不超过32个字符")
    private String agreementVersion;

    /** 职位（legacy） */
    @Size(max = 64, message = "职位不超过64个字符")
    private String position;

    /** 部门（legacy） */
    @Size(max = 64, message = "部门不超过64个字符")
    private String department;
}
