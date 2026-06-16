package com.taoke.course.service.order;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.InvoiceAdminService;
import com.taoke.course.dto.order.AdminInvoiceListItemVO;
import com.taoke.course.dto.order.AdminInvoiceStatsVO;
import com.taoke.course.entity.order.InvoiceRequest;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.enums.ProductType;
import com.taoke.course.repository.order.InvoiceRequestRepository;
import com.taoke.course.repository.order.OrderItemRepository;
import com.taoke.user.api.UserService;
import com.taoke.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 发票申请管理实现
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Service
@RequiredArgsConstructor
public class InvoiceAdminServiceImpl implements InvoiceAdminService {

    private static final Map<Integer, String> STATUS_LABELS = Map.of(
            0, "待审核",
            1, "开具中",
            2, "已开具",
            3, "开具失败",
            4, "已驳回"
    );

    private final InvoiceRequestRepository invoiceRequestRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminInvoiceListItemVO> list(Integer status, String keyword,
                                                      LocalDate startDate, LocalDate endDate,
                                                      int page, int size) {
        int safePage = Math.max(1, page);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);

        Specification<InvoiceRequest> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), endDate.plusDays(1).atStartOfDay()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                List<Integer> userIds = userService.searchUsers(keyword.trim(), null, PageRequest.of(0, 50))
                        .getContent().stream().map(User::getId).toList();
                List<Predicate> keywordPreds = new ArrayList<>();
                keywordPreds.add(cb.like(root.get("orderNo"), like));
                keywordPreds.add(cb.like(root.get("title"), like));
                if (!userIds.isEmpty()) {
                    keywordPreds.add(root.get("userId").in(userIds));
                }
                predicates.add(cb.or(keywordPreds.toArray(Predicate[]::new)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Page<InvoiceRequest> pageResult = invoiceRequestRepository.findAll(
                spec, PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "id")));

        if (pageResult.isEmpty()) {
            return PageResponse.of(List.of(), 0, safePage, safeSize);
        }

        List<InvoiceRequest> records = pageResult.getContent();
        List<Integer> userIds = records.stream().map(InvoiceRequest::getUserId).distinct().toList();
        Map<Integer, String> userNameMap = userService.findAllByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, this::resolveUserName));

        List<Integer> orderIds = records.stream().map(InvoiceRequest::getOrderId).distinct().toList();
        Map<Integer, String> videoTitleMap = buildVideoTitleMap(orderIds);

        List<AdminInvoiceListItemVO> items = records.stream().map(entity -> {
            AdminInvoiceListItemVO vo = toListItemVO(entity);
            vo.setUserName(userNameMap.getOrDefault(entity.getUserId(), "UID:" + entity.getUserId()));
            vo.setVideoTitle(videoTitleMap.getOrDefault(entity.getOrderId(), ""));
            return vo;
        }).toList();

        return PageResponse.of(items, pageResult.getTotalElements(), safePage, safeSize);
    }

    @Override
    @Transactional
    public void approve(Integer id) {
        InvoiceRequest entity = getEntity(id);
        if (entity.getStatus() != 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅待审核的发票申请可通过");
        }
        entity.setStatus(1);
        entity.setRejectReason("");
        invoiceRequestRepository.save(entity);
    }

    @Override
    @Transactional
    public void reject(Integer id, String reason) {
        InvoiceRequest entity = getEntity(id);
        if (entity.getStatus() != 0 && entity.getStatus() != 1) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "当前状态不可驳回");
        }
        entity.setStatus(4);
        entity.setRejectReason(reason == null ? "" : reason.trim());
        invoiceRequestRepository.save(entity);
    }

    @Override
    @Transactional
    public void markIssued(Integer id, String invoiceFileUrl) {
        InvoiceRequest entity = getEntity(id);
        if (entity.getStatus() != 1) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅开具中的发票申请可标记为已开具");
        }
        entity.setStatus(2);
        entity.setIssuedAt(LocalDateTime.now());
        entity.setInvoiceFileUrl(invoiceFileUrl == null ? "" : invoiceFileUrl.trim());
        invoiceRequestRepository.save(entity);
    }

    @Override
    @Transactional
    public void batchApprove(List<Integer> ids) {
        if (ids != null) {
            ids.forEach(this::approve);
        }
    }

    @Override
    @Transactional
    public void batchReject(List<Integer> ids, String reason) {
        if (ids != null) {
            ids.forEach(id -> reject(id, reason));
        }
    }

    @Override
    @Transactional
    public void batchDelete(List<Integer> ids) {
        if (ids != null && !ids.isEmpty()) {
            invoiceRequestRepository.deleteAllById(ids);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AdminInvoiceStatsVO stats() {
        AdminInvoiceStatsVO vo = new AdminInvoiceStatsVO();
        Map<Integer, Long> counts = new LinkedHashMap<>();
        long total = 0;
        for (int status = 0; status <= 4; status++) {
            long count = invoiceRequestRepository.countByStatus(status);
            counts.put(status, count);
            total += count;
        }
        vo.setCounts(counts);
        vo.setTotal(total);
        return vo;
    }

    private InvoiceRequest getEntity(Integer id) {
        return invoiceRequestRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "发票申请不存在"));
    }

    private AdminInvoiceListItemVO toListItemVO(InvoiceRequest entity) {
        AdminInvoiceListItemVO vo = new AdminInvoiceListItemVO();
        vo.setId(entity.getId());
        vo.setOrderId(entity.getOrderId());
        vo.setOrderNo(entity.getOrderNo());
        vo.setUserId(entity.getUserId());
        vo.setInvoiceType(entity.getInvoiceType());
        vo.setInvoiceTypeLabel(invoiceTypeLabel(entity.getInvoiceType()));
        vo.setTitleType(entity.getTitleType());
        vo.setTitleTypeLabel(titleTypeLabel(entity.getTitleType()));
        vo.setAmount(entity.getAmount());
        vo.setTitle(entity.getTitle());
        vo.setTaxNo(entity.getTaxNo());
        vo.setBankName(entity.getBankName());
        vo.setBankAccount(entity.getBankAccount());
        vo.setCompanyAddress(entity.getCompanyAddress());
        vo.setCompanyPhone(entity.getCompanyPhone());
        vo.setEmail(entity.getEmail());
        vo.setStatus(entity.getStatus());
        vo.setStatusLabel(STATUS_LABELS.getOrDefault(entity.getStatus(), "未知"));
        vo.setRejectReason(entity.getRejectReason());
        vo.setIssuedAt(entity.getIssuedAt());
        vo.setInvoiceFileUrl(entity.getInvoiceFileUrl());
        vo.setCreatedAt(entity.getCreatedAt());
        return vo;
    }

    private Map<Integer, String> buildVideoTitleMap(List<Integer> orderIds) {
        if (orderIds.isEmpty()) {
            return Map.of();
        }
        return orderItemRepository.findByOrderIdIn(orderIds).stream()
                .filter(i -> i.getProductType() == ProductType.VIDEO_COURSE
                        || i.getProductType() == ProductType.VIDEO_PACKAGE)
                .collect(Collectors.groupingBy(
                        OrderItem::getOrderId,
                        Collectors.mapping(OrderItem::getProductTitle,
                                Collectors.collectingAndThen(Collectors.toList(), titles -> titles.stream()
                                        .filter(t -> t != null && !t.isBlank())
                                        .distinct()
                                        .collect(Collectors.joining("、"))))
                ));
    }

    private String invoiceTypeLabel(String type) {
        if ("SPECIAL".equals(type)) {
            return "全电发票-增值税专用发票";
        }
        if ("NORMAL".equals(type)) {
            return "全电发票-普通发票";
        }
        return type;
    }

    private String titleTypeLabel(String type) {
        if ("COMPANY".equals(type)) {
            return "企业";
        }
        if ("PERSONAL".equals(type)) {
            return "个人";
        }
        return type;
    }

    private String resolveUserName(User user) {
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname().trim();
        }
        if (user.getRealName() != null && !user.getRealName().isBlank()) {
            return user.getRealName().trim();
        }
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            return user.getPhone().trim();
        }
        return "UID:" + user.getId();
    }
}
