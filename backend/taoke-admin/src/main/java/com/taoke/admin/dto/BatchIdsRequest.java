package com.taoke.admin.dto;

import lombok.Data;

import java.util.List;

/**
 * 批量 ID 操作请求体
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class BatchIdsRequest {

    private List<Integer> ids;
}
