package com.taoke.user.dto.agent;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存专家经纪人档案请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class AgentRequest {

    /** 服务介绍 */
    private String bio;

    /** 擅长领域，JSON 数组字符串 */
    @Size(max = 512, message = "擅长领域不超过512个字符")
    private String specialties;

    /** 服务城市 ID 列表，JSON 数组字符串 */
    @Size(max = 512, message = "服务城市列表不超过512个字符")
    private String serviceCityIds;

    /**
     * 申请加入的目标经纪公司 ID（apply 时必填，save 时可空）。
     * <p>用于经纪人主动申请加入经纪公司的新流程；不再走平台审核。
     */
    private Integer enterpriseAgentId;
}
