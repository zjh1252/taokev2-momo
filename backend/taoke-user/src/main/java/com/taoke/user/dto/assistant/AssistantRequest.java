package com.taoke.user.dto.assistant;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 保存专家助理档案请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class AssistantRequest {

    @Size(max = 512, message = "服务描述不超过512个字符")
    private String bio;

    @Size(max = 512, message = "授权范围说明不超过512个字符")
    private String authScope;
}
