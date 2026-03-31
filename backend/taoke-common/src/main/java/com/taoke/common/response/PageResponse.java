package com.taoke.common.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * 通用分页响应
 * <p>
 * 将 Spring Data 的 Page 转换为前端友好的结构，避免前端直接依赖 Spring 分页对象。
 *
 * @param <T> 列表元素类型
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    /** 当前页数据列表 */
    private List<T> list;

    /** 总记录数 */
    private long total;

    /** 当前页码（从 1 开始） */
    private int page;

    /** 每页条数 */
    private int size;

    /** 总页数 */
    private int totalPages;

    /**
     * 从 Spring Data Page 直接转换（元素类型不变）
     */
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getTotalElements(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalPages()
        );
    }

    /**
     * 从 Spring Data Page 转换并映射元素类型（Entity → VO/DTO）
     */
    public static <S, T> PageResponse<T> of(Page<S> page, Function<S, T> converter) {
        List<T> converted = page.getContent().stream()
                .map(converter)
                .toList();
        return new PageResponse<>(
                converted,
                page.getTotalElements(),
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalPages()
        );
    }

    /**
     * 手动构建分页结果（用于三段式查询等非 JPA 分页场景）
     */
    public static <T> PageResponse<T> of(List<T> list, long total, int page, int size) {
        int totalPages = (int) Math.ceil((double) total / size);
        return new PageResponse<>(list, total, page, size, totalPages);
    }

}
