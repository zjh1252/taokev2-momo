package com.taoke.course.service.pxb;

import com.taoke.course.api.PxbLegacyOrderService;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoEnrollment;
import com.taoke.course.entity.video.VideoPackageGroup;
import com.taoke.course.entity.video.VideoPackageRelation;
import com.taoke.course.entity.video.VideoStudent;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.repository.order.OrderItemRepository;
import com.taoke.course.repository.order.OrderRepository;
import com.taoke.course.repository.video.VideoEnrollmentRepository;
import com.taoke.course.repository.video.VideoPackageGroupRepository;
import com.taoke.course.repository.video.VideoPackageRelationRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.repository.video.VideoStudentRepository;
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
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class PxbLegacyOrderServiceImpl implements PxbLegacyOrderService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final VideoPackageGroupRepository groupRepository;
    private final VideoPackageRelationRepository relationRepository;
    private final VideoRepository videoRepository;
    private final VideoEnrollmentRepository videoEnrollmentRepository;
    private final VideoStudentRepository videoStudentRepository;
    private final UserService userService;

    @Override
    @Transactional
    public Map<String, Object> generatePackageOrder(Integer userId,
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
                                                    String appId) {
        Map<String, Object> fail = new LinkedHashMap<>();
        fail.put("isok", false);
        fail.put("msg", "订单所需信息不完整");

        if (userId == null || userId <= 0 || packageIds == null || packageIds.isEmpty()) {
            return fail;
        }

        Set<Integer> ignore = ignorePackageIds != null
                ? new HashSet<>(ignorePackageIds) : Set.of();

        LocalDateTime validFrom = beginTime != null ? beginTime : LocalDateTime.now();
        LocalDateTime validUntil = endTime != null ? endTime : validFrom.plusYears(1);

        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setTotalAmount(total != null ? total : BigDecimal.ZERO);
        order.setPayAmount(total != null ? total : BigDecimal.ZERO);
        order.setStatus(OrderStatus.PAID.getValue());
        order.setPaidAt(LocalDateTime.now());
        order.setPxbRootId(pxbRootId != null ? pxbRootId : 0);
        order.setPxbKefu(pxbKefu != null ? pxbKefu : "");
        order.setPxbRemarks(pxbRemarks != null ? pxbRemarks : "");
        order.setConcurrency(Math.max(concurrency, 1));
        order.setCopyRootId(copyRootId);
        order.setOrderSubject(orderSubject != null ? orderSubject : "");
        order.setValidFrom(validFrom);
        order.setValidUntil(validUntil);
        order.setLegacyStatus(3);
        order.setRemark(buildTradeRemark(appId));
        order = orderRepository.save(order);

        boolean anyVideo = false;
        for (Integer packageId : packageIds) {
            if (packageId == null || packageId <= 0) {
                continue;
            }
            anyVideo |= addPackageToOrder(order, packageId, ignore, total, isIncludePaper);
        }

        if (!anyVideo) {
            fail.put("msg", "添加失败，没有找到与包匹配的视频 packageIds:" + packageIds);
            return fail;
        }

        Map<String, Object> msg = new LinkedHashMap<>();
        msg.put("order_code", order.getOrderNo());
        msg.put("order_subject", order.getOrderSubject());
        msg.put("status", 3);
        msg.put("starttime", toEpochSeconds(order.getValidFrom()));
        msg.put("endtime", toEpochSeconds(order.getValidUntil()));

        Map<String, Object> ok = new LinkedHashMap<>();
        ok.put("isok", true);
        ok.put("msg", msg);
        return ok;
    }

    @Override
    public Map<String, Object> listOrders(List<Integer> userIds,
                                          Map<String, String> filter,
                                          int page,
                                          int pageSize) {
        Specification<Order> spec = buildOrderSpec(userIds, filter);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), 100);
        Page<Order> pageResult = orderRepository.findAll(
                spec,
                PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "id"))
        );

        List<Map<String, Object>> ordersList = new ArrayList<>();
        for (Order order : pageResult.getContent()) {
            ordersList.add(toLegacyOrderRow(order));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", pageResult.getTotalElements());
        result.put("orders_list", ordersList);
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> restoreByOrderCode(String orderCode, int isIncludePaper) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (!StringUtils.hasText(orderCode)) {
            result.put("isok", false);
            result.put("msg", "订单不存在");
            return result;
        }
        Optional<Order> orderOpt = orderRepository.findByOrderNo(orderCode.trim());
        if (orderOpt.isEmpty()) {
            result.put("isok", false);
            result.put("msg", "订单" + orderCode + "不存在");
            return result;
        }
        Order order = orderOpt.get();
        if (!Objects.equals(order.getStatus(), OrderStatus.PAID.getValue())) {
            result.put("isok", false);
            result.put("msg", "订单未支付，无法入库");
            return result;
        }
        fulfillOrderEnrollments(order);
        result.put("isok", true);
        result.put("msg", "入库成功");
        return result;
    }

    @Override
    public List<Integer> getVideoIdsByOrderCode(String orderCode) {
        if (!StringUtils.hasText(orderCode)) {
            return List.of();
        }
        Optional<Order> orderOpt = orderRepository.findByOrderNo(orderCode.trim());
        if (orderOpt.isEmpty()) {
            return List.of();
        }
        Order order = orderOpt.get();
        LinkedHashSet<Integer> videoIds = new LinkedHashSet<>();
        for (OrderItem item : orderItemRepository.findByOrderId(order.getId())) {
            if (item.getProductType() == ProductType.VIDEO_COURSE) {
                videoIds.add(item.getProductId());
            } else if (item.getProductType() == ProductType.VIDEO_PACKAGE) {
                groupRepository.findById(item.getProductId()).ifPresent(group ->
                        videoIds.addAll(collectVideoIds(group.getPackageId(), Set.of())));
            }
        }
        for (VideoEnrollment enrollment : videoEnrollmentRepository.findByOrderId(order.getId())) {
            if (Objects.equals(enrollment.getStatus(), 1)) {
                videoIds.add(enrollment.getVideoId());
            }
        }
        return List.copyOf(videoIds);
    }

    private boolean addPackageToOrder(Order order,
                                      Integer packageId,
                                      Set<Integer> ignoreTopicIds,
                                      BigDecimal total,
                                      int isIncludePaper) {
        Optional<VideoPackageGroup> groupOpt = groupRepository.findFirstByParentIdAndTopicId(packageId, 0);
        if (groupOpt.isEmpty()) {
            groupOpt = groupRepository.findByParentId(packageId).stream().findFirst();
        }

        List<Integer> videoIds = collectVideoIds(packageId, ignoreTopicIds);
        if (videoIds.isEmpty()) {
            return false;
        }

        if (groupOpt.isPresent()) {
            VideoPackageGroup group = groupOpt.get();
            OrderItem item = new OrderItem();
            item.setOrderId(order.getId());
            item.setProductType(ProductType.VIDEO_PACKAGE);
            item.setProductId(group.getId());
            item.setProductTitle(group.getName());
            item.setPrice(group.getPrice());
            item.setQuantity(1);
            item.setSubtotal(total != null && total.signum() > 0
                    ? total : group.getPrice());
            orderItemRepository.save(item);
            createEnrollmentsForRelations(order, group.getPackageId(), group.getTopicId(),
                    group.getParentId(), order.getValidUntil(), item.getSubtotal());
        } else {
            BigDecimal each = total != null && total.signum() > 0
                    ? total.divide(BigDecimal.valueOf(videoIds.size()), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            for (Integer videoId : videoIds) {
                videoRepository.findById(videoId).ifPresent(video -> {
                    OrderItem item = new OrderItem();
                    item.setOrderId(order.getId());
                    item.setProductType(ProductType.VIDEO_COURSE);
                    item.setProductId(videoId);
                    item.setProductTitle(video.getTitle());
                    item.setProductCover(video.getCoverUrl());
                    item.setPrice(each);
                    item.setQuantity(1);
                    item.setSubtotal(each);
                    orderItemRepository.save(item);
                    createOrRenewEnrollment(order.getUserId(), order.getId(), videoId, each, order.getValidUntil());
                });
            }
        }
        return true;
    }

    private List<Integer> collectVideoIds(Integer packageId, Set<Integer> ignoreTopicIds) {
        List<Integer> ids = relationRepository.findPublishedVideoIdsByPackage(packageId, 0);
        if (ignoreTopicIds == null || ignoreTopicIds.isEmpty()) {
            return ids;
        }
        List<Integer> filtered = new ArrayList<>();
        for (Integer videoId : ids) {
            List<VideoPackageRelation> rels = relationRepository.findByVideoIdOrderByPrimaryDescIdAsc(videoId);
            boolean skip = rels.stream()
                    .anyMatch(r -> Objects.equals(r.getParentId(), packageId)
                            && ignoreTopicIds.contains(r.getTopicId()));
            if (!skip) {
                filtered.add(videoId);
            }
        }
        return filtered;
    }

    private void createEnrollmentsForRelations(Order order,
                                               Integer packageId,
                                               Integer topicId,
                                               Integer parentId,
                                               LocalDateTime expiredAt,
                                               BigDecimal pricePaid) {
        List<VideoPackageRelation> relations = relationRepository
                .findByPackageIdAndTopicIdAndParentIdOrderBySortOrderAscVideoIdAsc(
                        packageId, topicId != null ? topicId : 0, parentId != null ? parentId : 0);
        if (relations.isEmpty()) {
            relations = relationRepository.findByParentId(parentId != null ? parentId : packageId);
        }
        for (VideoPackageRelation relation : relations) {
            createOrRenewEnrollment(order.getUserId(), order.getId(), relation.getVideoId(),
                    pricePaid, expiredAt);
        }
    }

    private void fulfillOrderEnrollments(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        LocalDateTime expiredAt = order.getValidUntil() != null
                ? order.getValidUntil() : LocalDateTime.now().plusYears(1);
        for (OrderItem item : items) {
            if (item.getProductType() == ProductType.VIDEO_COURSE) {
                createOrRenewEnrollment(order.getUserId(), order.getId(), item.getProductId(),
                        item.getSubtotal(), expiredAt);
            } else if (item.getProductType() == ProductType.VIDEO_PACKAGE) {
                groupRepository.findById(item.getProductId()).ifPresent(group ->
                        createEnrollmentsForRelations(order, group.getPackageId(), group.getTopicId(),
                                group.getParentId(), expiredAt, item.getSubtotal()));
            }
        }
    }

    private void createOrRenewEnrollment(Integer userId,
                                         Integer orderId,
                                         Integer videoId,
                                         BigDecimal pricePaid,
                                         LocalDateTime expiredAt) {
        Optional<VideoEnrollment> existing = videoEnrollmentRepository.findByVideoIdAndUserId(videoId, userId);
        if (existing.isPresent() && Objects.equals(existing.get().getStatus(), 1)) {
            VideoEnrollment e = existing.get();
            if (e.getExpiredAt() == null || e.getExpiredAt().isBefore(LocalDateTime.now())) {
                e.setOrderId(orderId);
                e.setPricePaid(pricePaid != null ? pricePaid : BigDecimal.ZERO);
                e.setEnrolledAt(LocalDateTime.now());
                e.setExpiredAt(expiredAt);
                videoEnrollmentRepository.save(e);
            }
            return;
        }
        VideoEnrollment enrollment = new VideoEnrollment();
        enrollment.setVideoId(videoId);
        enrollment.setUserId(userId);
        enrollment.setOrderId(orderId);
        enrollment.setPricePaid(pricePaid != null ? pricePaid : BigDecimal.ZERO);
        enrollment.setEnrolledAt(LocalDateTime.now());
        enrollment.setExpiredAt(expiredAt);
        enrollment.setStatus(1);
        enrollment = videoEnrollmentRepository.save(enrollment);

        if (!videoStudentRepository.existsByVideoIdAndUserId(videoId, userId)) {
            VideoStudent student = new VideoStudent();
            student.setVideoId(videoId);
            student.setUserId(userId);
            student.setEnrollmentId(enrollment.getId());
            videoStudentRepository.save(student);
        }
    }

    private Specification<Order> buildOrderSpec(List<Integer> userIds, Map<String, String> filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (userIds != null && !userIds.isEmpty()) {
                predicates.add(root.get("userId").in(userIds));
            }
            if (filter != null) {
                applyLegacyStatusFilter(filter, root, cb, predicates);
                applyTimeFilter(filter, "start_time_start", "start_time_end", "validFrom", root, cb, predicates);
                applyTimeFilter(filter, "end_time_start", "end_time_end", "validUntil", root, cb, predicates);
                String rootCompany = filter.get("root_company_id");
                if (StringUtils.hasText(rootCompany)) {
                    int rc = Integer.parseInt(rootCompany.trim());
                    predicates.add(cb.or(
                            cb.equal(root.get("pxbRootId"), 0),
                            cb.equal(root.get("pxbRootId"), rc)
                    ));
                }
            }
            predicates.add(cb.lessThan(root.get("status"), 5));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static void applyLegacyStatusFilter(Map<String, String> filter,
                                                jakarta.persistence.criteria.Root<Order> root,
                                                jakarta.persistence.criteria.CriteriaBuilder cb,
                                                List<Predicate> predicates) {
        String status = filter.get("order_status");
        if (!StringUtils.hasText(status)) {
            return;
        }
        int s = Integer.parseInt(status.trim());
        if (s == -1 || s > 1) {
            predicates.add(cb.equal(root.get("legacyStatus"), s));
        } else {
            predicates.add(root.get("status").in(0, 1));
        }
    }

    private static void applyTimeFilter(Map<String, String> filter,
                                        String startKey,
                                        String endKey,
                                        String field,
                                        jakarta.persistence.criteria.Root<Order> root,
                                        jakarta.persistence.criteria.CriteriaBuilder cb,
                                        List<Predicate> predicates) {
        String start = filter.get(startKey);
        String end = filter.get(endKey);
        if (StringUtils.hasText(start)) {
            long ts = Long.parseLong(start.trim());
            predicates.add(cb.greaterThanOrEqualTo(root.get(field),
                    LocalDateTime.ofInstant(java.time.Instant.ofEpochSecond(ts), ZONE)));
        }
        if (StringUtils.hasText(end)) {
            long ts = Long.parseLong(end.trim());
            predicates.add(cb.lessThanOrEqualTo(root.get(field),
                    LocalDateTime.ofInstant(java.time.Instant.ofEpochSecond(ts), ZONE)));
        }
    }

    private Map<String, Object> toLegacyOrderRow(Order order) {
        User user = userService.findAllByIds(List.of(order.getUserId())).stream().findFirst().orElse(null);
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<Integer> videoIds = items.stream()
                .filter(i -> i.getProductType() == ProductType.VIDEO_COURSE)
                .map(OrderItem::getProductId)
                .toList();

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", order.getId());
        row.put("order_code", order.getOrderNo());
        row.put("uid", order.getUserId());
        row.put("total", order.getPayAmount().setScale(2, RoundingMode.HALF_UP).toPlainString());
        row.put("status", order.getLegacyStatus() != null ? order.getLegacyStatus() : mapNewStatusToLegacy(order));
        row.put("starttime", toEpochSeconds(order.getValidFrom()));
        row.put("endtime", toEpochSeconds(order.getValidUntil()));
        row.put("pxb_root_id", order.getPxbRootId());
        row.put("concurrency", order.getConcurrency());
        row.put("order_subject", order.getOrderSubject());
        row.put("pxb_kefu", order.getPxbKefu());
        row.put("pxb_remarks", order.getPxbRemarks());
        row.put("username", user != null ? user.getUsername() : "");
        row.put("realname", user != null ? user.getRealName() : "");
        row.put("cdbid", user != null ? user.getUcUid() : 0);
        row.put("video_id_list", videoIds);
        row.put("is_include_paper", 0);
        row.put("pay_status", legacyPayStatusLabel(order));
        return row;
    }

    private static int mapNewStatusToLegacy(Order order) {
        if (Objects.equals(order.getStatus(), OrderStatus.PAID.getValue())) {
            if (order.getValidUntil() != null && order.getValidUntil().isBefore(LocalDateTime.now())) {
                return -1;
            }
            return 3;
        }
        if (Objects.equals(order.getStatus(), OrderStatus.EXPIRED.getValue())) {
            return -1;
        }
        if (Objects.equals(order.getStatus(), OrderStatus.CANCELLED.getValue())) {
            return 4;
        }
        return order.getStatus();
    }

    private static String legacyPayStatusLabel(Order order) {
        int legacy = order.getLegacyStatus() != null ? order.getLegacyStatus() : mapNewStatusToLegacy(order);
        return switch (legacy) {
            case 3 -> "已支付";
            case 4 -> "已取消";
            case 2 -> "支付待确认";
            case -1 -> "已过期";
            default -> "待支付";
        };
    }

    private static long toEpochSeconds(LocalDateTime time) {
        if (time == null) {
            return 0L;
        }
        return time.atZone(ZONE).toEpochSecond();
    }

    private static String buildTradeRemark(String appId) {
        String day = LocalDateTime.now().toLocalDate().toString();
        if (StringUtils.hasText(appId)) {
            return "接入商接口开通[" + appId + "] " + day;
        }
        return "培训宝接口开通 " + day;
    }

    private static String generateOrderNo() {
        String ts = LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int suffix = ThreadLocalRandom.current().nextInt(1000, 10000);
        return "TK" + ts + suffix;
    }
}
