package com.taoke.common.response;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * 通用分页请求参数，可在 Controller 中作为 @ModelAttribute 或 @RequestBody 嵌套字段使用。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Data
public class PageRequest {

    /** 页码，从 1 开始 */
    @Min(value = 1, message = "页码最小为 1")
    private int page = 1;

    /** 每页条数，默认 20，最大 100 */
    @Min(value = 1, message = "每页条数最小为 1")
    @Max(value = 100, message = "每页条数最大为 100")
    private int size = 20;

    public org.springframework.data.domain.PageRequest toPageable() {
        return org.springframework.data.domain.PageRequest.of(page - 1, size);
    }

}
