package com.taoke.course.service.pxb;

import com.taoke.course.api.PxbLegacyPackageQueryService;
import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.course.dto.pxb.PxbLegacyTopicRow;
import com.taoke.course.dto.pxb.PxbLegacyVideoRow;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.order.OrderItem;
import com.taoke.course.entity.video.VideoPackageGroup;
import com.taoke.course.enums.OrderStatus;
import com.taoke.course.enums.ProductType;
import com.taoke.course.repository.order.OrderItemRepository;
import com.taoke.course.repository.order.OrderRepository;
import com.taoke.course.repository.video.VideoPackageGroupRepository;
import com.taoke.course.repository.video.VideoPackageRelationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PxbLegacyPackageQueryServiceImpl implements PxbLegacyPackageQueryService {

    private final VideoPackageGroupRepository groupRepository;
    private final VideoPackageRelationRepository relationRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PxbLegacyVideoQueryService legacyVideoQueryService;

    @Override
    public List<PxbLegacyTopicRow> listCourseTopics(boolean orderBySupplier) {
        Map<Integer, String> topicNames = groupRepository.findAllTopicHeaders().stream()
                .collect(Collectors.toMap(
                        VideoPackageGroup::getPackageId,
                        VideoPackageGroup::getName,
                        (a, b) -> a,
                        LinkedHashMap::new));

        List<VideoPackageGroup> series = orderBySupplier
                ? groupRepository.findAllSeriesOrderBySupplier()
                : groupRepository.findAllSeriesOrderByDefault();

        return series.stream()
                .map(g -> toTopicRow(g, topicNames.getOrDefault(g.getPackageId(), "")))
                .toList();
    }

    @Override
    public List<PxbLegacyTopicRow> applyTopicBuyState(Integer userId,
                                                      List<PxbLegacyTopicRow> topics,
                                                      Integer pxbRootId) {
        if (userId == null || userId <= 0 || topics == null || topics.isEmpty()) {
            return topics;
        }
        Map<Integer, Integer> packageBuyStatus = resolvePackageBuyStatus(userId, pxbRootId);
        if (packageBuyStatus.isEmpty()) {
            return topics;
        }

        Map<Integer, PxbLegacyTopicRow> byId = topics.stream()
                .collect(Collectors.toMap(PxbLegacyTopicRow::getId, t -> t, (a, b) -> a, LinkedHashMap::new));

        for (PxbLegacyTopicRow topic : byId.values()) {
            if (topic.getItemParent() != null && topic.getItemParent() == 0) {
                topic.setBuyStatus(0);
            }
        }

        for (Map.Entry<Integer, Integer> entry : packageBuyStatus.entrySet()) {
            Integer packageId = entry.getKey();
            Integer status = entry.getValue();
            PxbLegacyTopicRow row = byId.get(packageId);
            if (row == null) {
                continue;
            }
            if (row.getItemParent() != null && row.getItemParent() > 0) {
                PxbLegacyTopicRow parent = byId.get(row.getItemParent());
                if (parent != null) {
                    parent.setBuyStatus(status);
                } else {
                    row.setBuyStatus(status);
                }
            } else {
                row.setBuyStatus(status);
            }
        }
        return new ArrayList<>(byId.values());
    }

    @Override
    public long countTopicCourses(Integer packageId, Integer secondId) {
        if (packageId == null || packageId <= 0) {
            return 0;
        }
        int topicId = secondId != null ? secondId : 0;
        return relationRepository.countPublishedVideosByPackage(packageId, topicId);
    }

    @Override
    public List<PxbLegacyVideoRow> listTopicCourses(Integer packageId,
                                                    Integer secondId,
                                                    int start,
                                                    int perPage) {
        if (packageId == null || packageId <= 0) {
            return List.of();
        }
        int topicId = secondId != null ? secondId : 0;
        List<Integer> allIds = relationRepository.findPublishedVideoIdsByPackage(packageId, topicId);
        if (allIds.isEmpty()) {
            return List.of();
        }
        int from = Math.max(start, 0);
        int to = Math.min(from + Math.max(perPage, 1), allIds.size());
        if (from >= allIds.size()) {
            return List.of();
        }
        List<Integer> pageIds = allIds.subList(from, to);
        return legacyVideoQueryService.findPublishedVideosByIds(pageIds);
    }

    @Override
    public List<Integer> listTopicCourseIds(Integer packageId, Integer secondId) {
        if (packageId == null || packageId <= 0) {
            return List.of();
        }
        int topicId = secondId != null ? secondId : 0;
        return relationRepository.findPublishedVideoIdsByPackage(packageId, topicId);
    }

    @Override
    public long countSeriesVideosInPackage(Integer packageId) {
        if (packageId == null || packageId <= 0) {
            return 0;
        }
        return relationRepository.countSeriesEpisodesByPackage(packageId);
    }

    @Override
    public Map<Integer, PxbLegacyPurchaseInfo> findPurchaseInfoForVideos(Integer userId,
                                                                          List<Integer> videoIds,
                                                                          Integer pxbRootId) {
        return legacyVideoQueryService.findPurchaseInfoByVideoIds(userId, videoIds, pxbRootId);
    }

    @Override
    public int findNextPackageVideoId(int videoId) {
        if (videoId <= 0) {
            return 0;
        }
        Integer nextId = relationRepository.findNextPrimaryVideoIdInPackage(videoId);
        return nextId != null && nextId > 0 ? nextId : 0;
    }

    private Map<Integer, Integer> resolvePackageBuyStatus(Integer userId, Integer pxbRootId) {
        List<Order> paidOrders = orderRepository.findByUserIdAndStatus(userId, OrderStatus.PAID.getValue());
        LocalDateTime now = LocalDateTime.now();
        Map<Integer, Integer> result = new HashMap<>();

        for (Order order : paidOrders) {
            if (!matchesPxbRoot(order, pxbRootId)) {
                continue;
            }
            int legacyStatus = resolveLegacyOrderStatus(order, now);
            if (legacyStatus != 3 && legacyStatus != -1) {
                continue;
            }
            int buyStatus = legacyStatus == 3 ? 1 : -1;
            for (OrderItem item : orderItemRepository.findByOrderId(order.getId())) {
                if (item.getProductType() != ProductType.VIDEO_PACKAGE) {
                    continue;
                }
                groupRepository.findById(item.getProductId()).ifPresent(group -> {
                    Integer legacyId = group.getTopicId() != null && group.getTopicId() > 0
                            ? group.getTopicId()
                            : group.getParentId();
                    if (legacyId != null && legacyId > 0) {
                        result.put(legacyId, buyStatus);
                    }
                });
            }
        }
        return result;
    }

    private static int resolveLegacyOrderStatus(Order order, LocalDateTime now) {
        if (order.getLegacyStatus() != null) {
            return order.getLegacyStatus();
        }
        if (order.getValidUntil() != null && order.getValidUntil().isBefore(now)) {
            return -1;
        }
        return 3;
    }

    private static boolean matchesPxbRoot(Order order, Integer pxbRootId) {
        if (pxbRootId == null || pxbRootId <= 0) {
            return true;
        }
        Integer root = order.getPxbRootId() != null ? order.getPxbRootId() : 0;
        return root == 0 || root.equals(pxbRootId);
    }

    private PxbLegacyTopicRow toTopicRow(VideoPackageGroup group, String topicName) {
        return PxbLegacyTopicRow.builder()
                .id(group.getTopicId())
                .topicId(group.getPackageId())
                .itemName(group.getName())
                .itemIndex(group.getItemIndex())
                .itemParent(group.getParentId())
                .type(group.getType())
                .serialIndex(group.getSerialIndex())
                .price(toLegacyPrice(group.getPrice()))
                .companyPrice(group.getCompanyPrice() != null ? group.getCompanyPrice() : BigDecimal.ZERO)
                .disabled(0)
                .topicName(topicName)
                .packageCode(group.getPackageCode() != null ? group.getPackageCode() : "")
                .descr(group.getDescr())
                .cover(group.getCover())
                .buyStatus(0)
                .build();
    }

    private static int toLegacyPrice(BigDecimal price) {
        if (price == null) {
            return 0;
        }
        return price.intValue();
    }
}
