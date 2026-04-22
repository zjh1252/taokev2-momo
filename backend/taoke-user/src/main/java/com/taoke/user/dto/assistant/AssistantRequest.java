package com.taoke.user.dto.assistant;

import com.taoke.user.dto.common.ServiceCityItem;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 保存专家助理档案请求
 *
 * <p>新版表单仅收集真实姓名 / 联系电话 / 常用邮箱 / 服务城市 / 协议；
 * 旧 {@code bio / authScope} 字段保留以兼容历史调用，服务层不再强制要求其填写。</p>
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class AssistantRequest {

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

    /** 多服务城市（结构化） */
    private List<ServiceCityItem> serviceCities;

    /** 是否同意《淘课网注册专家助理合作协议》（apply 时必须为 true） */
    private Boolean agreementSigned;

    /** 协议版本号，前端默认 v1 */
    @Size(max = 32, message = "协议版本号不超过32个字符")
    private String agreementVersion;

    // ---- 历史字段（保留以兼容旧调用） ----

    @Size(max = 512, message = "服务描述不超过512个字符")
    private String bio;

    @Size(max = 512, message = "授权范围说明不超过512个字符")
    private String authScope;
}
