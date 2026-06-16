package com.taoke.admin.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * 后台录播课订单列表查询参数
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class AdminVideoOrderQuery {

    private int page = 1;

    private int size = 10;

    private String keyword;

    private Integer status;

    private String publisherKeyword;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate endDate;
}
