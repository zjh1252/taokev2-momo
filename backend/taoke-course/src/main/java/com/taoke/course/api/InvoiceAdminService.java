package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.order.AdminInvoiceListItemVO;
import com.taoke.course.dto.order.AdminInvoiceStatsVO;

import java.time.LocalDate;
import java.util.List;

/**
 * 发票申请管理接口 — 供 taoke-admin 编排层调用
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
public interface InvoiceAdminService {

    PageResponse<AdminInvoiceListItemVO> list(Integer status, String keyword,
                                               LocalDate startDate, LocalDate endDate,
                                               int page, int size);

    void approve(Integer id);

    void reject(Integer id, String reason);

    void markIssued(Integer id, String invoiceFileUrl);

    void batchApprove(List<Integer> ids);

    void batchReject(List<Integer> ids, String reason);

    void batchDelete(List<Integer> ids);

    AdminInvoiceStatsVO stats();
}
