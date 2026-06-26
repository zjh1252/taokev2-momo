package com.taoke.course.dto.order;

import lombok.Data;

import java.util.Map;

/**
 * 管理后台发票状态统计
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class AdminInvoiceStatsVO {

    /** key=status value=count */
    private Map<Integer, Long> counts;

    private long total;
}
