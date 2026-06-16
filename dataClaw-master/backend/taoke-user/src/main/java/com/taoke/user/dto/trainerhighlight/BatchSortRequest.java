package com.taoke.user.dto.trainerhighlight;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 批量排序请求（传入 ID 列表，按传入顺序设置 sortOrder）
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Data
public class BatchSortRequest {

    @NotEmpty(message = "排序列表不能为空")
    private List<Integer> ids;
}
