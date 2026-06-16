package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.order.AdminVideoOrderListItemVO;

import java.time.LocalDate;
import java.util.List;

/**
 * 录播课订单管理接口 — 供 taoke-admin 编排层调用
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
public interface VideoOrderAdminService {

    /**
     * 分页查询录播课相关订单（VIDEO_COURSE / VIDEO_PACKAGE）
     */
    PageResponse<AdminVideoOrderListItemVO> listVideoOrders(String keyword, Integer status,
                                                             String publisherKeyword,
                                                             LocalDate startDate, LocalDate endDate,
                                                             int page, int size);

    /**
     * 按订单 ID 查询详情
     */
    AdminVideoOrderListItemVO getDetailById(Integer orderId);

    /**
     * 刷新订单支付状态（对待支付订单同步支付记录）
     */
    AdminVideoOrderListItemVO refreshOrderStatus(String orderNo);

    /**
     * 批量删除订单（仅待支付/已取消/已过期）
     */
    void batchDelete(List<Integer> ids);
}
