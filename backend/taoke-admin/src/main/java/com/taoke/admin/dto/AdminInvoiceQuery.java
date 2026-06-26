package com.taoke.admin.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * 后台发票申请列表查询参数
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class AdminInvoiceQuery {

    private int page = 1;

    private int size = 10;

    private Integer status;

    private String keyword;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDate;
}
