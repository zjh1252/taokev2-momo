package com.taoke.course.service.city;

import com.taoke.common.entity.Region;
import com.taoke.common.repository.RegionRepository;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.CityChannelService;
import com.taoke.course.api.CourseService;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.city.ActiveCityVO;
import com.taoke.course.dto.city.CityChannelDetailVO;
import com.taoke.course.dto.city.CityChannelHomeVO;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.dto.course.PublicCourseQuery;
import com.taoke.course.dto.video.VideoListItemVO;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.institution.InstitutionListItemResponse;
import com.taoke.user.dto.trainer.TrainerListItemResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;

/**
 * 城市频道服务实现 — 聚合 course_plans + regions 输出「有效公开课的城市」。
 *
 * <p>查询口径（与首页卡片、城市频道页一致）：</p>
 * <ul>
 *   <li>course.status = 2（已上架）</li>
 *   <li>course.type = OPEN_OFFLINE（线下公开课，唯一具备真实城市的课程类型）</li>
 *   <li>course_plans.start_time &gt;= 当前时间（仍可报名/即将开课）</li>
 *   <li>course_plans.city_id &gt; 0（排除线上课的 0 占位）</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-05-20 17:30
 */
@Service
@Transactional(readOnly = true)
public class CityChannelServiceImpl implements CityChannelService {

    private static final Logger log = LoggerFactory.getLogger(CityChannelServiceImpl.class);

    /** 4 个直辖市的省级 region.code（V9 行政区划数据），用于 enName 处理与 fallback */
    private static final Set<String> MUNICIPALITY_PROVINCE_CODES = Set.of(
            "110000000000", // 北京
            "120000000000", // 天津
            "310000000000", // 上海
            "500000000000"  // 重庆
    );

    /** 城市展示名常去掉的后缀（按长度从长到短） */
    private static final String[] NAME_SUFFIXES = {
            "维吾尔自治区", "回族自治区", "壮族自治区", "特别行政区",
            "自治区", "自治州", "自治县", "地区", "盟", "市", "省"
    };

    /** EntityManager 通过 @PersistenceContext 字段注入，不参与构造器 */
    @PersistenceContext
    private EntityManager entityManager;

    private final RegionRepository regionRepository;
    private final CourseService courseService;
    private final VideoService videoService;
    private final InstitutionService institutionService;
    private final TrainerService trainerService;

    public CityChannelServiceImpl(
            RegionRepository regionRepository,
            CourseService courseService,
            VideoService videoService,
            InstitutionService institutionService,
            TrainerService trainerService) {
        this.regionRepository = regionRepository;
        this.courseService = courseService;
        this.videoService = videoService;
        this.institutionService = institutionService;
        this.trainerService = trainerService;
    }

    @Override
    public List<ActiveCityVO> listActiveCities(int limit) {
        if (limit <= 0) {
            return List.of();
        }

        // JPQL 聚合：按 cityId 分组统计未开课的有效线下公开课数量
        Query q = entityManager.createQuery(
                "SELECT cp.cityId, COUNT(DISTINCT cp.courseId) "
                        + "FROM CoursePlan cp, Course c "
                        + "WHERE cp.courseId = c.id "
                        + "  AND c.status = 2 "
                        + "  AND c.type = com.taoke.course.enums.CourseType.OPEN_OFFLINE "
                        + "  AND cp.cityId > 0 "
                        + "  AND cp.endTime >= :now "
                        + "  AND (c.isExpireHide IS NULL OR c.isExpireHide <> 1 "
                        + "       OR c.courseOpenEndDate IS NULL "
                        + "       OR c.courseOpenEndDate >= :today) "
                        + "GROUP BY cp.cityId "
                        + "ORDER BY COUNT(DISTINCT cp.courseId) DESC, cp.cityId ASC");
        q.setParameter("now", LocalDateTime.now());
        q.setParameter("today", LocalDate.now());
        q.setMaxResults(limit);
        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();

        if (rows.isEmpty()) {
            return List.of();
        }

        // 批量取 region（level=2 的市/直辖市市辖区）
        List<Integer> cityRegionIds = rows.stream().map(r -> (Integer) r[0]).toList();
        List<Region> regions = regionRepository.findAllById(cityRegionIds);
        Map<Integer, Region> regionMap = new HashMap<>();
        for (Region r : regions) {
            regionMap.put(r.getId(), r);
        }

        // 为直辖市补充 parent（level=1）的拼音与展示名
        Map<String, Region> provinceByCode = batchLoadProvinces(regions);

        List<ActiveCityVO> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            Integer cityRegionId = (Integer) row[0];
            Long count = (Long) row[1];
            Region city = regionMap.get(cityRegionId);
            if (city == null || city.getEnName() == null) {
                continue; // 缺拼音的脏数据跳过
            }

            // 直辖市的市辖区：enName = parent.enName（去掉 "-1" 后缀的版本），cityName = parent name 去「市」
            boolean isMunicipalityChild = MUNICIPALITY_PROVINCE_CODES.contains(city.getParentCode());
            String enName;
            String cityName;
            if (isMunicipalityChild) {
                Region prov = provinceByCode.get(city.getParentCode());
                enName = prov != null && prov.getEnName() != null ? prov.getEnName() : stripDashSuffix(city.getEnName());
                cityName = prov != null ? stripCommonSuffix(prov.getName()) : "市辖区";
            } else {
                enName = city.getEnName();
                cityName = stripCommonSuffix(city.getName());
            }

            result.add(ActiveCityVO.builder()
                    .enName(enName)
                    .cityName(cityName)
                    .cityRegionId(cityRegionId)
                    .courseCount(count)
                    .build());
        }
        return result;
    }

    @Override
    public CityChannelDetailVO resolveByEnName(String enName) {
        if (enName == null || enName.isBlank()) {
            return null;
        }
        Optional<Region> opt = regionRepository.findByEnName(enName);
        if (opt.isEmpty()) {
            return null;
        }
        Region region = opt.get();

        // level=1（省级）：必须是直辖市；过滤 id 用省级主键（老库 course_plans / 专家 cityId 均存省级 id）
        if (region.getLevel() != null && region.getLevel() == 1) {
            if (!MUNICIPALITY_PROVINCE_CODES.contains(region.getCode())) {
                return null; // 普通省份不能作为城市频道
            }
            return CityChannelDetailVO.builder()
                    .enName(enName)
                    .cityName(stripCommonSuffix(region.getName()))
                    .provinceName(region.getName())
                    .cityRegionId(region.getId())
                    .provinceRegionId(region.getId())
                    .build();
        }

        // level=2（市级）：普通城市直接用自身 id；直辖市下属区划改用省级 id（与老库 course_plans 一致）
        Region province = regionRepository.findByCode(region.getParentCode()).orElse(null);
        Integer filterCityId = region.getId();
        if (province != null && MUNICIPALITY_PROVINCE_CODES.contains(region.getParentCode())) {
            filterCityId = province.getId();
        }
        return CityChannelDetailVO.builder()
                .enName(enName)
                .cityName(stripCommonSuffix(
                        province != null && MUNICIPALITY_PROVINCE_CODES.contains(region.getParentCode())
                                ? province.getName() : region.getName()))
                .provinceName(province != null ? province.getName() : null)
                .cityRegionId(filterCityId)
                .provinceRegionId(province != null ? province.getId() : null)
                .build();
    }

    /**
     * 综合页聚合：挂起类级只读事务，并行调用各列表服务（各自短事务 / Redis），避免串行拉长 TTFB。
     */
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public CityChannelHomeVO loadHome(String enName) {
        CityChannelDetailVO detail = resolveByEnName(enName);
        if (detail == null || detail.getCityRegionId() == null) {
            return null;
        }
        int cityId = detail.getCityRegionId();

        CompletableFuture<PageResponse<CourseListItemVO>> upcomingF =
                CompletableFuture.supplyAsync(() -> safeCourse(() -> courseService.listPublic(upcomingQuery(cityId)), 10));
        CompletableFuture<PageResponse<CourseListItemVO>> hotInnerF =
                CompletableFuture.supplyAsync(() -> safeCourse(() -> courseService.listPublic(hotInnerQuery(cityId)), 10));
        CompletableFuture<PageResponse<CourseListItemVO>> latestOpenF =
                CompletableFuture.supplyAsync(() -> safeCourse(() -> courseService.listPublic(latestOpenQuery(cityId)), 10));
        CompletableFuture<PageResponse<VideoListItemVO>> videosF =
                CompletableFuture.supplyAsync(() -> safeVideo(() ->
                        videoService.listPublic(null, null, null, "time", null, null, 1, 10, null), 10));
        CompletableFuture<PageResponse<InstitutionListItemResponse>> institutionsF =
                CompletableFuture.supplyAsync(() -> safeInstitution(() ->
                        institutionService.listPublic(
                                1, 20, null, "newly_joined", null, null, null, null, cityId), 20));
        CompletableFuture<PageResponse<TrainerListItemResponse>> trainersF =
                CompletableFuture.supplyAsync(() -> safeTrainer(() ->
                        trainerService.listPublic(
                                1, 20, null, null, null, cityId, null, "newly_joined", null, false), 20));

        CompletableFuture.allOf(upcomingF, hotInnerF, latestOpenF, videosF, institutionsF, trainersF).join();

        return CityChannelHomeVO.builder()
                .detail(detail)
                .upcomingOpen(upcomingF.join())
                .hotInner(hotInnerF.join())
                .latestOpen(latestOpenF.join())
                .latestVideos(videosF.join())
                .institutions(institutionsF.join())
                .trainers(trainersF.join())
                .build();
    }

    private static PublicCourseQuery upcomingQuery(int cityId) {
        PublicCourseQuery q = new PublicCourseQuery();
        q.setPage(1);
        q.setSize(10);
        q.setIsOpen(true);
        q.setCityIds(List.of(cityId));
        q.setEnrollStatus("ENROLLING");
        q.setSortBy("time");
        return q;
    }

    private static PublicCourseQuery hotInnerQuery(int cityId) {
        PublicCourseQuery q = new PublicCourseQuery();
        q.setPage(1);
        q.setSize(10);
        q.setIsOpen(false);
        q.setTrainerCityId(cityId);
        q.setSortBy("viewCount");
        return q;
    }

    private static PublicCourseQuery latestOpenQuery(int cityId) {
        PublicCourseQuery q = new PublicCourseQuery();
        q.setPage(1);
        q.setSize(10);
        q.setIsOpen(true);
        q.setCityIds(List.of(cityId));
        q.setSortBy("published");
        return q;
    }

    private PageResponse<CourseListItemVO> safeCourse(Supplier<PageResponse<CourseListItemVO>> supplier, int size) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("城市频道公开课块查询失败: {}", e.getMessage());
            return PageResponse.of(List.of(), 0, 1, size);
        }
    }

    private PageResponse<VideoListItemVO> safeVideo(Supplier<PageResponse<VideoListItemVO>> supplier, int size) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("城市频道录播块查询失败: {}", e.getMessage());
            return PageResponse.of(List.of(), 0, 1, size);
        }
    }

    private PageResponse<InstitutionListItemResponse> safeInstitution(
            Supplier<PageResponse<InstitutionListItemResponse>> supplier, int size) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("城市频道机构块查询失败: {}", e.getMessage());
            return PageResponse.of(List.of(), 0, 1, size);
        }
    }

    private PageResponse<TrainerListItemResponse> safeTrainer(
            Supplier<PageResponse<TrainerListItemResponse>> supplier, int size) {
        try {
            return supplier.get();
        } catch (Exception e) {
            log.warn("城市频道专家块查询失败: {}", e.getMessage());
            return PageResponse.of(List.of(), 0, 1, size);
        }
    }

    /** 批量取 regions 对应的 parent（直辖市拼装用） */
    private Map<String, Region> batchLoadProvinces(List<Region> cities) {
        Set<String> codes = new java.util.HashSet<>();
        for (Region c : cities) {
            if (MUNICIPALITY_PROVINCE_CODES.contains(c.getParentCode())) {
                codes.add(c.getParentCode());
            }
        }
        if (codes.isEmpty()) {
            return Map.of();
        }
        Map<String, Region> map = new HashMap<>();
        for (String code : codes) {
            regionRepository.findByCode(code).ifPresent(r -> map.put(code, r));
        }
        return map;
    }

    /** 剥离常见行政后缀，用于展示 */
    private static String stripCommonSuffix(String name) {
        if (name == null) {
            return "";
        }
        for (String suf : NAME_SUFFIXES) {
            if (name.length() > suf.length() && name.endsWith(suf)) {
                return name.substring(0, name.length() - suf.length());
            }
        }
        return name;
    }

    /** 去掉 enName 的 "-1" 后缀（直辖市市辖区 → 省级 slug） */
    private static String stripDashSuffix(String enName) {
        if (enName == null) {
            return null;
        }
        return enName.endsWith("-1") ? enName.substring(0, enName.length() - 2) : enName;
    }
}
