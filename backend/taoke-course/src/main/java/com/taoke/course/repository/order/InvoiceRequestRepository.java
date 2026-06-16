package com.taoke.course.repository.order;

import com.taoke.course.entity.order.InvoiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

/**
 * 发票申请仓库
 *
 * @author Fangxinxin
 * @date 2026-06-11 14:00
 */
public interface InvoiceRequestRepository extends JpaRepository<InvoiceRequest, Integer>,
        JpaSpecificationExecutor<InvoiceRequest> {

    Optional<InvoiceRequest> findByOrderIdAndUserId(Integer orderId, Integer userId);

    boolean existsByOrderId(Integer orderId);

    long countByStatus(Integer status);
}
