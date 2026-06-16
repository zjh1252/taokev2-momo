package com.taoke.course.dto.order;

import lombok.Data;

/**
 * 标记发票已开具请求
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class MarkInvoiceIssuedRequest {

    private String invoiceFileUrl;
}
