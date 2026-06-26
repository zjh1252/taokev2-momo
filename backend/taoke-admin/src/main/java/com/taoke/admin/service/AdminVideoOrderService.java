package com.taoke.admin.service;

import com.taoke.admin.dto.AdminVideoOrderQuery;
import com.taoke.admin.dto.BatchIdsRequest;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.VideoOrderAdminService;
import com.taoke.course.dto.order.AdminVideoOrderListItemVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 后台录播课订单编排服务
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Service
@RequiredArgsConstructor
public class AdminVideoOrderService {

    private final VideoOrderAdminService videoOrderAdminService;

    public PageResponse<AdminVideoOrderListItemVO> list(AdminVideoOrderQuery query) {
        return videoOrderAdminService.listVideoOrders(
                query.getKeyword(), query.getStatus(), query.getPublisherKeyword(),
                query.getStartDate(), query.getEndDate(),
                query.getPage(), query.getSize());
    }

    public AdminVideoOrderListItemVO getDetail(Integer id) {
        return videoOrderAdminService.getDetailById(id);
    }

    public AdminVideoOrderListItemVO refreshOrderStatus(String orderNo) {
        return videoOrderAdminService.refreshOrderStatus(orderNo);
    }

    public void batchDelete(BatchIdsRequest request) {
        videoOrderAdminService.batchDelete(request.getIds());
    }
}
