package com.taoke.course.api;

import com.taoke.course.dto.pxb.PxbLegacyOrderPage;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 培训宝 legacy 套餐订单（generateOrder / getOrders / restoreByOrderCode）。
 */
public interface PxbLegacyOrderService {

    Map<String, Object> generatePackageOrder(Integer userId,
                                             List<Integer> packageIds,
                                             BigDecimal total,
                                             String pxbKefu,
                                             String pxbRemarks,
                                             String orderSubject,
                                             int isIncludePaper,
                                             int copyRootId,
                                             int concurrency,
                                             Integer pxbRootId,
                                             LocalDateTime beginTime,
                                             LocalDateTime endTime,
                                             List<Integer> ignorePackageIds,
                                             String appId);

    PxbLegacyOrderPage listOrders(List<Integer> userIds,
                                  Map<String, String> filter,
                                  int page,
                                  int pageSize);

    Map<String, Object> restoreByOrderCode(String orderCode, int isIncludePaper);

    /** getVideoIdsByOrderCode */
    List<Integer> getVideoIdsByOrderCode(String orderCode);
}
