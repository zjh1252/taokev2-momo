package com.taoke.course.service.order;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.dto.order.CreateInvoiceRequest;
import com.taoke.course.dto.order.InvoiceRequestVO;
import com.taoke.course.entity.order.InvoiceRequest;
import com.taoke.course.entity.order.Order;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.repository.order.InvoiceRequestRepository;
import com.taoke.course.repository.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 发票申请业务实现
 *
 * @author Fangxinxin
 * @date 2026-06-11 14:00
 */
@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl {

    private final InvoiceRequestRepository invoiceRequestRepository;
    private final OrderRepository orderRepository;

    /**
     * 提交发票申请
     * <p>仅本人已支付订单可申请，每个订单只允许申请一次；开票金额取订单实付金额，不接受前端传入。</p>
     */
    @Transactional
    public InvoiceRequestVO submit(Integer userId, String orderNo, CreateInvoiceRequest request) {
        Order order = orderRepository.findByOrderNoAndUserId(orderNo, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        if (order.getStatus() != OrderStatus.PAID.getValue()) {
            throw new BusinessException(ErrorCode.INVOICE_ORDER_NOT_PAID);
        }
        if (invoiceRequestRepository.existsByOrderId(order.getId())) {
            throw new BusinessException(ErrorCode.INVOICE_ALREADY_REQUESTED);
        }

        boolean company = "COMPANY".equals(request.getTitleType());
        if (company && isBlank(request.getTaxNo())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "企业抬头需填写纳税人识别号");
        }

        InvoiceRequest entity = new InvoiceRequest();
        entity.setOrderId(order.getId());
        entity.setOrderNo(order.getOrderNo());
        entity.setUserId(userId);
        entity.setInvoiceType(request.getInvoiceType());
        entity.setTitleType(request.getTitleType());
        entity.setAmount(order.getPayAmount());
        entity.setTitle(request.getTitle().trim());
        entity.setEmail(request.getEmail().trim());
        if (company) {
            entity.setTaxNo(trimToEmpty(request.getTaxNo()));
            entity.setBankName(trimToEmpty(request.getBankName()));
            entity.setBankAccount(trimToEmpty(request.getBankAccount()));
            entity.setCompanyAddress(trimToEmpty(request.getCompanyAddress()));
            entity.setCompanyPhone(trimToEmpty(request.getCompanyPhone()));
        }
        invoiceRequestRepository.save(entity);
        return toVO(entity);
    }

    /**
     * 查询订单的发票申请（未申请时返回 null）
     */
    public InvoiceRequestVO getByOrderNo(Integer userId, String orderNo) {
        Order order = orderRepository.findByOrderNoAndUserId(orderNo, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));
        return invoiceRequestRepository.findByOrderIdAndUserId(order.getId(), userId)
                .map(this::toVO)
                .orElse(null);
    }

    private InvoiceRequestVO toVO(InvoiceRequest entity) {
        InvoiceRequestVO vo = new InvoiceRequestVO();
        vo.setId(entity.getId());
        vo.setOrderNo(entity.getOrderNo());
        vo.setInvoiceType(entity.getInvoiceType());
        vo.setTitleType(entity.getTitleType());
        vo.setAmount(entity.getAmount());
        vo.setTitle(entity.getTitle());
        vo.setTaxNo(entity.getTaxNo());
        vo.setBankName(entity.getBankName());
        vo.setBankAccount(entity.getBankAccount());
        vo.setCompanyAddress(entity.getCompanyAddress());
        vo.setCompanyPhone(entity.getCompanyPhone());
        vo.setEmail(entity.getEmail());
        vo.setStatus(entity.getStatus());
        vo.setCreatedAt(entity.getCreatedAt());
        return vo;
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private String trimToEmpty(String s) {
        return s == null ? "" : s.trim();
    }
}
