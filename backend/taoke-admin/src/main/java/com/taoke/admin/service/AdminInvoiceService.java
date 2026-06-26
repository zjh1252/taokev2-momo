package com.taoke.admin.service;

import com.taoke.admin.dto.AdminInvoiceQuery;
import com.taoke.admin.dto.BatchIdsRequest;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.InvoiceAdminService;
import com.taoke.course.dto.order.AdminInvoiceListItemVO;
import com.taoke.course.dto.order.AdminInvoiceStatsVO;
import com.taoke.course.dto.order.MarkInvoiceIssuedRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 后台发票管理编排服务
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Service
@RequiredArgsConstructor
public class AdminInvoiceService {

    private final InvoiceAdminService invoiceAdminService;

    public PageResponse<AdminInvoiceListItemVO> list(AdminInvoiceQuery query) {
        return invoiceAdminService.list(
                query.getStatus(), query.getKeyword(),
                query.getStartDate(), query.getEndDate(),
                query.getPage(), query.getSize());
    }

    public void approve(Integer id) {
        invoiceAdminService.approve(id);
    }

    public void reject(Integer id, String reason) {
        invoiceAdminService.reject(id, reason);
    }

    public void markIssued(Integer id, MarkInvoiceIssuedRequest request) {
        String url = request != null ? request.getInvoiceFileUrl() : null;
        invoiceAdminService.markIssued(id, url);
    }

    public void batchApprove(BatchIdsRequest request) {
        invoiceAdminService.batchApprove(request.getIds());
    }

    public void batchReject(BatchIdsRequest request, String reason) {
        invoiceAdminService.batchReject(request.getIds(), reason);
    }

    public void batchDelete(BatchIdsRequest request) {
        invoiceAdminService.batchDelete(request.getIds());
    }

    public AdminInvoiceStatsVO stats() {
        return invoiceAdminService.stats();
    }
}
