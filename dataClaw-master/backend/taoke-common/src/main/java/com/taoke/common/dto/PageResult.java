package com.taoke.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 通用分页结果封装。
 *
 * @param <T> 列表元素类型
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {

    /** 总记录数 */
    private long total;

    /** 当前页码（从 1 开始） */
    private int page;

    /** 每页条数 */
    private int size;

    /** 当前页数据列表 */
    private List<T> list;

    public static <T> PageResult<T> of(long total, int page, int size, List<T> list) {
        return new PageResult<>(total, page, size, list);
    }
}
