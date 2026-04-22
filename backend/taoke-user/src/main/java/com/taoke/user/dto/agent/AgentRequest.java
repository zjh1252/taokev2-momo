package com.taoke.user.dto.agent;

import com.taoke.user.dto.common.ServiceCityItem;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 保存专家经纪人档案请求
 *
 * <p>新版表单按真实姓名 / 联系电话 / 常用邮箱 / 服务城市 / 所属经纪公司 / 协议
 * 收集字段；旧 {@code bio / specialties / serviceCityIds} 字段保留以兼容历史调用，
 * 服务层不再强制要求其填写。</p>
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class AgentRequest {

    /** 真实姓名 */
    @Size(max = 64, message = "真实姓名不超过64个字符")
    private String realName;

    /** 联系电话（apply 时必填） */
    @Size(max = 20, message = "联系电话不超过20个字符")
    private String contactPhone;

    /** 常用邮箱 */
    @Email(message = "邮箱格式不正确")
    @Size(max = 128, message = "邮箱不超过128个字符")
    private String email;

    /** 多服务城市（结构化），与 {@code serviceCityIds} 互不影响，可同时存在 */
    private List<ServiceCityItem> serviceCities;

    /**
     * 申请加入的目标经纪公司 ID（apply 时必填，save 时可空）。
     * <p>用于经纪人主动申请加入经纪公司的新流程；不再走平台审核。
     */
    private Integer enterpriseAgentId;

    /** 是否同意《淘课网注册专家经纪人合作协议》（apply 时必须为 true） */
    private Boolean agreementSigned;

    /** 协议版本号，前端默认 v1 */
    @Size(max = 32, message = "协议版本号不超过32个字符")
    private String agreementVersion;

    // ---- 历史字段（保留以兼容旧调用，新表单不再收集） ----

    /** 服务介绍（历史字段） */
    private String bio;

    /** 擅长领域 JSON 数组字符串（历史字段） */
    @Size(max = 512, message = "擅长领域不超过512个字符")
    private String specialties;

    /** 服务城市 ID 列表 JSON 字符串（历史字段，已被 serviceCities 替代） */
    @Size(max = 512, message = "服务城市列表不超过512个字符")
    private String serviceCityIds;
}
