package com.taoke.user.service;

import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.entity.Category;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.common.service.RegionService;
import com.taoke.common.util.LegacyAvatarUrls;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.TrainerListItemEnricher;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.trainer.*;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.*;
import com.taoke.user.mapper.TrainerMapper;
import com.taoke.user.repository.*;
import com.taoke.user.support.PublicTrainerListCache;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 专家档案服务 — 主表 CRUD + 子表整体替换式保存。
 * <p>
 * 查询详情时采用显式分步加载（主表 → 各子表各一条 SQL），避免 N+1。
 * 分类关联输出时通过 CategoryService 批量回填 categoryName。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Service
@RequiredArgsConstructor
public class TrainerServiceImpl implements TrainerService {

    /** V10/V11 演示种子用户手机号段，与迁移库真实用户区分 */
    private static final String SEED_IMPORT_PHONE_PREFIX = "132666600";

    private final TrainerRepository trainerRepository;
    private final TrainerEducationRepository educationRepository;
    private final TrainerWorkExperienceRepository workExperienceRepository;
    private final TrainerHonorRepository honorRepository;
    private final TrainerExpertiseCategoryRepository expertiseCategoryRepository;
    private final TrainerIndustryCategoryRepository industryCategoryRepository;
    private final TrainerBookRepository trainerBookRepository;
    private final TrainerMapper trainerMapper;
    private final RoleApplyService roleApplyService;
    private final CategoryService categoryService;
    private final RegionService regionService;
    /** 头像统一存到 sys_users.avatar_url，保存专家档案时一并更新 User 表 */
    private final UserRepository userRepository;
    private final OpsMaterialResolver opsMaterialResolver;
    private final RoleApplicationChangeLogService changeLogService;
    private final Optional<TrainerListItemEnricher> trainerListItemEnricher;
    private final PublicTrainerListCache publicTrainerListCache;

    @Override
    public TrainerResponse getByUserId(Integer userId) {
        Trainer trainer = trainerRepository.findByUserId(userId).orElse(null);
        if (trainer == null) {
            return null;
        }
        return assembleFullResponse(trainer);
    }

    @Override
    public PageResponse<TrainerListItemResponse> listPublic(int page, int size,
                                                            Integer expertiseCategoryId,
                                                            Integer industryCategoryId,
                                                            Integer provinceId,
                                                            Integer cityId,
                                                            String keyword,
                                                            String sort,
                                                            Integer isTrusted,
                                                            boolean includeCourse) {
        boolean cacheable = publicTrainerListCache.isCacheableDefault(
                page, size, expertiseCategoryId, industryCategoryId, provinceId, cityId,
                keyword, sort, isTrusted);
        if (cacheable) {
            PageResponse<TrainerListItemResponse> cached =
                    publicTrainerListCache.getDefaultList(sort, page, size, includeCourse);
            if (cached != null) {
                return cached;
            }
        }

        Sort jpaSort = buildPublicListSort(sort);

        PageRequest pageable = PageRequest.of(page - 1, size, jpaSort);

        // 第一段：查分页 ID（带动态条件）
        Specification<Trainer> spec = buildListSpec(
                expertiseCategoryId, industryCategoryId, provinceId, cityId, keyword, isTrusted);
        Page<Trainer> trainerPage = trainerRepository.findAll(spec, pageable);

        if (trainerPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<Integer> trainerIds = trainerPage.getContent().stream().map(Trainer::getId).toList();

        // 第二段：回表查主表（已在 trainerPage.getContent() 中）
        Map<Integer, Trainer> trainerMap = trainerPage.getContent().stream()
                .collect(Collectors.toMap(Trainer::getId, Function.identity()));

        // 第三段：批量查擅长领域 / 行业分类
        List<TrainerExpertiseCategory> allExpertise =
                expertiseCategoryRepository.findByTrainerIdInOrderBySortOrder(trainerIds);
        Map<Integer, List<TrainerExpertiseCategory>> expertiseMap = allExpertise.stream()
                .collect(Collectors.groupingBy(TrainerExpertiseCategory::getTrainerId));

        List<TrainerIndustryCategory> allIndustry =
                industryCategoryRepository.findByTrainerIdInOrderBySortOrder(trainerIds);
        Map<Integer, List<TrainerIndustryCategory>> industryMap = allIndustry.stream()
                .collect(Collectors.groupingBy(TrainerIndustryCategory::getTrainerId));

        // 批量获取分类名称
        Set<Integer> categoryIds = new HashSet<>();
        allExpertise.forEach(ec -> categoryIds.add(ec.getCategoryId()));
        allIndustry.forEach(ic -> categoryIds.add(ic.getCategoryId()));
        Map<Integer, String> categoryNameMap = categoryIds.isEmpty()
                ? Map.of()
                : categoryService.getNameMap(categoryIds);

        // 批量获取省市名称
        Set<Integer> regionIds = new HashSet<>();
        trainerMap.values().forEach(t -> {
            if (t.getProvinceId() != null && t.getProvinceId() > 0) regionIds.add(t.getProvinceId());
            if (t.getCityId() != null && t.getCityId() > 0) regionIds.add(t.getCityId());
        });
        Map<Integer, String> regionNameMap = regionIds.isEmpty()
                ? Map.of()
                : regionService.getNamesByIds(regionIds);

        Map<Integer, String> userAvatarMap = loadUserAvatarMap(
                trainerMap.values().stream().map(Trainer::getUserId).filter(Objects::nonNull).toList());

        // 组装结果，保持 ID 原始顺序
        List<TrainerListItemResponse> items = trainerIds.stream().map(id -> {
            Trainer t = trainerMap.get(id);
            TrainerListItemResponse item = trainerMapper.toListItemResponse(t);
            applyDisplayAvatar(item, t, userAvatarMap);

            List<CategoryRefDTO> catRefs = expertiseMap.getOrDefault(id, List.of()).stream().map(ec -> {
                CategoryRefDTO dto = new CategoryRefDTO();
                dto.setId(ec.getId());
                dto.setCategoryId(ec.getCategoryId());
                dto.setSortOrder(ec.getSortOrder());
                dto.setCategoryName(categoryNameMap.get(ec.getCategoryId()));
                return dto;
            }).toList();
            item.setExpertiseCategories(catRefs);

            List<CategoryRefDTO> indRefs = industryMap.getOrDefault(id, List.of()).stream().map(ic -> {
                CategoryRefDTO dto = new CategoryRefDTO();
                dto.setId(ic.getId());
                dto.setCategoryId(ic.getCategoryId());
                dto.setSortOrder(ic.getSortOrder());
                dto.setCategoryName(categoryNameMap.get(ic.getCategoryId()));
                return dto;
            }).toList();
            item.setIndustryCategories(indRefs);

            // 填充省市名称
            item.setProvinceName(regionNameMap.get(t.getProvinceId()));
            item.setCityName(regionNameMap.get(t.getCityId()));

            return item;
        }).toList();

        if (includeCourse) {
            trainerListItemEnricher.ifPresent(enricher -> enricher.enrich(items));
        }

        PageResponse<TrainerListItemResponse> response =
                PageResponse.of(items, trainerPage.getTotalElements(), page, size);
        if (cacheable) {
            publicTrainerListCache.putDefaultList(sort, page, size, includeCourse, response);
        }
        return response;
    }

    @Override
    public Map<Integer, Long> countPublicByExpertiseL1(boolean includeChildren) {
        if (!includeChildren) {
            Map<Integer, Long> cached = publicTrainerListCache.getExpertiseL1Counts();
            if (cached != null) {
                return cached;
            }
        }
        Map<Integer, Long> map = toCountMap(
                expertiseCategoryRepository.countPublishedTrainersByExpertiseL1());
        if (includeChildren) {
            map.putAll(toCountMap(expertiseCategoryRepository.countPublishedTrainersByExpertiseL2()));
        } else {
            publicTrainerListCache.putExpertiseL1Counts(map);
        }
        return map;
    }

    @Override
    public Map<Integer, Long> countPublicByIndustry() {
        return toCountMap(industryCategoryRepository.countPublishedTrainersByIndustry());
    }

    private static Map<Integer, Long> toCountMap(List<Object[]> rows) {
        Map<Integer, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            if (row[0] != null) {
                map.put(((Number) row[0]).intValue(),
                        row[1] != null ? ((Number) row[1]).longValue() : 0L);
            }
        }
        return map;
    }

    @Override
    public List<Integer> findPublishedTrainerIds(Integer industryCategoryId,
                                                 Integer provinceId,
                                                 Integer cityId,
                                                 Integer isTrusted,
                                                 Integer hasCopyrightCourse) {
        Specification<Trainer> spec = buildTrainerDimensionSpec(
                null, industryCategoryId, provinceId, cityId, isTrusted, hasCopyrightCourse, null);
        return trainerRepository.findAll(spec).stream().map(Trainer::getId).toList();
    }

    /**
     * 擅长领域筛选 ID 集合。
     * <p>一级分类时展开为其下全部二级，与专家列表底部分类统计口径一致；
     * 老站 PHP 列表仅按一级 {@code categoryIds} 精确匹配，底部分类数来自
     * {@code membercate_relation.cid = 一级ID}（见 {@code tkw/shell/statics_resourse_for_cate.php}）。</p>
     */
    private List<Integer> resolveExpertiseCategoryFilterIds(Integer expertiseCategoryId) {
        Category category = categoryService.getById(expertiseCategoryId);
        if (category == null) {
            return List.of(expertiseCategoryId);
        }
        if (!"TRAINER_EXPERTISE".equals(category.getType()) || category.getLevel() == null
                || category.getLevel() != 1) {
            return List.of(expertiseCategoryId);
        }
        List<Integer> ids = new ArrayList<>();
        ids.add(expertiseCategoryId);
        categoryService.getChildren("TRAINER_EXPERTISE", expertiseCategoryId).stream()
                .map(CategoryTreeVO::getId)
                .filter(Objects::nonNull)
                .forEach(ids::add);
        return ids;
    }

    /**
     * 公开列表排序。默认综合排序：信得过 → 签约 → sort_order → 评分（信得过标签优先展示）。
     */
    private Sort buildPublicListSort(String sort) {
        return switch (sort != null ? sort : "") {
            case "score" -> Sort.by(Sort.Direction.DESC, "score")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "score_asc" -> Sort.by(Sort.Direction.ASC, "score")
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "default_asc" -> Sort.by(Sort.Direction.ASC, "sortOrder")
                    .and(Sort.by(Sort.Direction.ASC, "score"))
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "newly_joined" -> Sort.by(Sort.Direction.DESC, "createdAt")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            default -> Sort.by(Sort.Direction.DESC, "isTrusted")
                    .and(Sort.by(Sort.Direction.DESC, "isSigned"))
                    .and(Sort.by(Sort.Direction.DESC, "sortOrder"))
                    .and(Sort.by(Sort.Direction.DESC, "score"))
                    .and(Sort.by(Sort.Direction.DESC, "id"));
        };
    }

    /** 构建列表查询的动态条件 */
    private Specification<Trainer> buildListSpec(Integer expertiseCategoryId,
                                                 Integer industryCategoryId,
                                                 Integer provinceId,
                                                 Integer cityId,
                                                 String keyword,
                                                 Integer isTrusted) {
        return buildTrainerDimensionSpec(
                expertiseCategoryId, industryCategoryId, provinceId, cityId, isTrusted, null, keyword);
    }

  /** 专家维度筛选（列表 / 课程反查共用） */
    private Specification<Trainer> buildTrainerDimensionSpec(Integer expertiseCategoryId,
                                                             Integer industryCategoryId,
                                                             Integer provinceId,
                                                             Integer cityId,
                                                             Integer isTrusted,
                                                             Integer hasCopyrightCourse,
                                                             String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), 2));

            if (provinceId != null) {
                predicates.add(cb.equal(root.get("provinceId"), provinceId));
            }

            if (cityId != null) {
                predicates.add(cb.equal(root.get("cityId"), cityId));
            }

            // 质量承诺 / 老站「优质讲师」：issign 或 is_xdg/isqc（迁库后 is_signed / is_trusted）
            if (isTrusted != null && isTrusted == 1) {
                predicates.add(cb.or(
                        cb.equal(root.get("isTrusted"), 1),
                        cb.equal(root.get("isSigned"), 1)));
            }

            if (hasCopyrightCourse != null && hasCopyrightCourse == 1) {
                predicates.add(cb.equal(root.get("hasCopyrightCourse"), 1));
            }

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("name"), pattern),
                        cb.like(root.get("title"), pattern),
                        cb.like(root.get("expertiseTags"), pattern)
                ));
            }

            if (expertiseCategoryId != null) {
                List<Integer> expertiseFilterIds = resolveExpertiseCategoryFilterIds(expertiseCategoryId);
                if (!expertiseFilterIds.isEmpty()) {
                    Subquery<Integer> sub = query.subquery(Integer.class);
                    Root<TrainerExpertiseCategory> ecRoot = sub.from(TrainerExpertiseCategory.class);
                    sub.select(ecRoot.get("trainerId"))
                       .where(ecRoot.get("categoryId").in(expertiseFilterIds));
                    predicates.add(root.get("id").in(sub));
                }
            }

            if (industryCategoryId != null) {
                Subquery<Integer> sub = query.subquery(Integer.class);
                Root<TrainerIndustryCategory> icRoot = sub.from(TrainerIndustryCategory.class);
                sub.select(icRoot.get("trainerId"))
                   .where(cb.equal(icRoot.get("categoryId"), industryCategoryId));
                predicates.add(root.get("id").in(sub));
            }

            // FIXME: 同名去重子查询导致分页查询极慢（每行一次 sys_users 关联），暂时关闭
            // 迁移数据与种子数据同名时，列表/筛选只展示迁移档案（如钟越 id=56185 优先于种子 id=16）
            // predicates.add(notExistsHigherPrioritySameNameTrainer(root, query, cb));

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    /**
     * 同名专家去重：存在更高优先级档案时隐藏当前记录。
     * <p>优先级：旧站迁移（user_id=id）&gt; 非种子导入手机号 &gt; 专家 id 较大。</p>
     */
    private Predicate notExistsHigherPrioritySameNameTrainer(Root<Trainer> root,
                                                             CriteriaQuery<?> query,
                                                             CriteriaBuilder cb) {
        Subquery<Integer> dup = query.subquery(Integer.class);
        Root<Trainer> other = dup.from(Trainer.class);

        Expression<Integer> selfPriority = trainerListPriorityScore(root, query, cb);
        Expression<Integer> otherPriority = trainerListPriorityScore(other, query, cb);

        dup.select(cb.literal(1)).where(
                cb.equal(other.get("status"), 2),
                cb.equal(other.get("name"), root.get("name")),
                cb.notEqual(other.get("id"), root.get("id")),
                cb.or(
                        cb.greaterThan(otherPriority, selfPriority),
                        cb.and(
                                cb.equal(otherPriority, selfPriority),
                                cb.greaterThan(other.get("id"), root.get("id"))
                        )
                )
        );
        return cb.not(cb.exists(dup));
    }

    /** 列表同名去重优先级分（越大越优先展示） */
    private Expression<Integer> trainerListPriorityScore(Root<Trainer> trainer,
                                                         CriteriaQuery<?> query,
                                                         CriteriaBuilder cb) {
        Expression<Integer> legacyScore = cb.<Integer>selectCase()
                .when(cb.equal(trainer.get("userId"), trainer.get("id")), 100)
                .otherwise(0);

        Subquery<Integer> seedPhone = query.subquery(Integer.class);
        Root<User> user = seedPhone.from(User.class);
        seedPhone.select(cb.literal(1)).where(
                cb.equal(user.get("id"), trainer.get("userId")),
                cb.like(user.get("phone"), SEED_IMPORT_PHONE_PREFIX + "%")
        );
        Expression<Integer> nonSeedScore = cb.<Integer>selectCase()
                .when(cb.exists(seedPhone), 0)
                .otherwise(10);

        return cb.sum(legacyScore, nonSeedScore);
    }

    @Override
    public Integer resolveCourseTrainerId(Integer trainerId) {
        if (trainerId == null || trainerId <= 0) {
            return trainerId;
        }
        Trainer current = trainerRepository.findById(trainerId).orElse(null);
        if (current == null || current.getName() == null || current.getName().isBlank()) {
            return trainerId;
        }

        List<Trainer> sameName = trainerRepository.findByName(current.getName());
        if (sameName.size() <= 1) {
            return trainerId;
        }

        Trainer best = current;
        int bestScore = trainerListPriorityScoreValue(best);
        for (Trainer other : sameName) {
            if (Objects.equals(other.getId(), current.getId())) {
                continue;
            }
            int otherScore = trainerListPriorityScoreValue(other);
            if (otherScore > bestScore
                    || (otherScore == bestScore && other.getId() > best.getId())) {
                best = other;
                bestScore = otherScore;
            }
        }

        if (bestScore > trainerListPriorityScoreValue(current) && isLegacyMigratedTrainer(best)) {
            return best.getId();
        }
        return trainerId;
    }

    private boolean isLegacyMigratedTrainer(Trainer trainer) {
        return trainer.getUserId() != null && trainer.getUserId().equals(trainer.getId());
    }

    private int trainerListPriorityScoreValue(Trainer trainer) {
        int legacy = isLegacyMigratedTrainer(trainer) ? 100 : 0;
        int nonSeed = isSeedImportTrainer(trainer) ? 0 : 10;
        return legacy + nonSeed;
    }

    private boolean isSeedImportTrainer(Trainer trainer) {
        if (trainer.getUserId() == null) {
            return false;
        }
        return userRepository.findById(trainer.getUserId())
                .map(u -> u.getPhone() != null && u.getPhone().startsWith(SEED_IMPORT_PHONE_PREFIX))
                .orElse(false);
    }

    @Override
    public TrainerPublicResponse getPublicProfile(Integer trainerId) {
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "专家不存在"));

        if (trainer.getStatus() != 2) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "专家不存在");
        }

        TrainerPublicResponse response = trainerMapper.toPublicResponse(trainer);
        applyDisplayAvatar(response, trainer, loadUserAvatarMap(
                trainer.getUserId() != null ? List.of(trainer.getUserId()) : List.of()));
        fillSubTableData(response, trainerId);

        // 填充省市名称
        List<Integer> regionIds = new ArrayList<>();
        if (trainer.getProvinceId() != null && trainer.getProvinceId() > 0) regionIds.add(trainer.getProvinceId());
        if (trainer.getCityId() != null && trainer.getCityId() > 0) regionIds.add(trainer.getCityId());
        if (!regionIds.isEmpty()) {
            Map<Integer, String> regionNames = regionService.getNamesByIds(regionIds);
            response.setProvinceName(regionNames.get(trainer.getProvinceId()));
            response.setCityName(regionNames.get(trainer.getCityId()));
        }

        return response;
    }

    @Transactional
    @Override
    public void incrementViewCount(Integer trainerId) {
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "专家不存在"));
        if (trainer.getStatus() != 2) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "专家不存在");
        }
        trainer.setViewCount((trainer.getViewCount() != null ? trainer.getViewCount() : 0) + 1);
        trainerRepository.save(trainer);
    }

    @Transactional
    @Override
    public void setRecommended(Integer trainerId, Integer value) {
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "专家不存在"));
        trainer.setIsRecommended(value != null && value == 1 ? 1 : 0);
        trainerRepository.save(trainer);
        publicTrainerListCache.evictPublicListCaches();
    }

    @Override
    public List<TrainerListItemResponse> listRecommendedForTop(int limit) {
        int target = limit > 0 ? limit : 9;
        Sort recSort = Sort.by(Sort.Direction.DESC, "sortOrder")
                .and(Sort.by(Sort.Direction.DESC, "score"))
                .and(Sort.by(Sort.Direction.DESC, "id"));

        // 1) 优先取已推荐 + 已上架
        Specification<Trainer> recSpec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("status"), 2),
                cb.equal(root.get("isRecommended"), 1)
        );
        List<Trainer> recommended = trainerRepository.findAll(recSpec, PageRequest.of(0, target, recSort))
                .getContent();

        LinkedHashSet<Integer> pickedIds = new LinkedHashSet<>();
        List<Trainer> picked = new ArrayList<>();
        for (Trainer trainer : recommended) {
            if (picked.size() >= target) {
                break;
            }
            if (pickedIds.add(trainer.getId())) {
                picked.add(trainer);
            }
        }

        // 2) 不足时按同排序规则用其他已上架专家补齐（去重）
        if (picked.size() < target) {
            int need = target - picked.size();
            Specification<Trainer> fillSpec = (root, cq, cb) -> {
                List<Predicate> predicates = new ArrayList<>();
                predicates.add(cb.equal(root.get("status"), 2));
                if (!pickedIds.isEmpty()) {
                    predicates.add(cb.not(root.get("id").in(pickedIds)));
                }
                return cb.and(predicates.toArray(Predicate[]::new));
            };
            List<Trainer> fillers = trainerRepository.findAll(fillSpec, PageRequest.of(0, need, recSort))
                    .getContent();
            for (Trainer trainer : fillers) {
                if (picked.size() >= target) {
                    break;
                }
                if (pickedIds.add(trainer.getId())) {
                    picked.add(trainer);
                }
            }
        }

        if (picked.isEmpty()) {
            return List.of();
        }

        Map<Integer, String> userAvatarMap = loadUserAvatarMap(
                picked.stream().map(Trainer::getUserId).filter(Objects::nonNull).toList());

        return picked.stream().map(t -> {
            TrainerListItemResponse item = trainerMapper.toListItemResponse(t);
            applyDisplayAvatar(item, t, userAvatarMap);
            item.setExpertiseCategories(List.of());
            return item;
        }).toList();
    }

    @Override
    public List<TrainerListItemResponse> listRecommendedTrainers(Integer trainerId) {
        if (trainerId == null || trainerId <= 0) {
            return List.of();
        }

        // 命中当前专家的擅长领域 / 擅长行业分类 ID
        List<Integer> expertiseIds = expertiseCategoryRepository
                .findByTrainerIdOrderBySortOrder(trainerId).stream()
                .map(TrainerExpertiseCategory::getCategoryId)
                .toList();
        List<Integer> industryIds = industryCategoryRepository
                .findByTrainerIdOrderBySortOrder(trainerId).stream()
                .map(TrainerIndustryCategory::getCategoryId)
                .toList();
        if (expertiseIds.isEmpty() && industryIds.isEmpty()) {
            return List.of();
        }

        // 候选专家 ID 集合：分别从两张关联表收集，再合并去重，剔除自己
        Set<Integer> candidateIds = new HashSet<>();
        if (!expertiseIds.isEmpty()) {
            for (TrainerExpertiseCategory ec : expertiseCategoryRepository.findByCategoryIdIn(expertiseIds)) {
                if (!Objects.equals(ec.getTrainerId(), trainerId)) {
                    candidateIds.add(ec.getTrainerId());
                }
            }
        }
        if (!industryIds.isEmpty()) {
            for (TrainerIndustryCategory ic : industryCategoryRepository.findByCategoryIdIn(industryIds)) {
                if (!Objects.equals(ic.getTrainerId(), trainerId)) {
                    candidateIds.add(ic.getTrainerId());
                }
            }
        }
        if (candidateIds.isEmpty()) {
            return List.of();
        }

        // 取候选专家中：状态=已通过（status=2），按推荐 + 评分倒序，最多 3 条
        Specification<Trainer> spec = (root, cq, cb) -> cb.and(
                root.get("id").in(candidateIds),
                cb.equal(root.get("status"), 2)
        );
        PageRequest pageable = PageRequest.of(0, 3,
                Sort.by(Sort.Direction.DESC, "isRecommended")
                        .and(Sort.by(Sort.Direction.DESC, "score"))
                        .and(Sort.by(Sort.Direction.DESC, "id")));
        List<Trainer> trainers = trainerRepository.findAll(spec, pageable).getContent();
        if (trainers.isEmpty()) {
            return List.of();
        }

        Map<Integer, String> userAvatarMap = loadUserAvatarMap(
                trainers.stream().map(Trainer::getUserId).filter(Objects::nonNull).toList());

        // 组装列表项（不需要分类、地区名称，留空即可，前端只展示头像/姓名/头衔/评分）
        return trainers.stream().map(t -> {
            TrainerListItemResponse item = trainerMapper.toListItemResponse(t);
            applyDisplayAvatar(item, t, userAvatarMap);
            item.setExpertiseCategories(List.of());
            return item;
        }).toList();
    }

    @Transactional
    @Override
    public TrainerResponse save(Integer userId, TrainerRequest request) {
        return assembleFullResponse(saveOrUpdateMainTable(userId, request));
    }

    @Transactional
    @Override
    public void apply(Integer userId, TrainerRequest request) {
        // 必须勾选《淘课网注册专家合作协议》才能提交申请
        if (request.getAgreementSigned() == null || !Boolean.TRUE.equals(request.getAgreementSigned())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID,
                    "请先勾选并同意《淘课网注册专家合作协议》");
        }
        validateApplyAvatar(userId, request);
        // 在写数据前先获取旧快照（用于资料重审变更记录）
        Trainer oldSnapshot = trainerRepository.findByUserId(userId).orElse(null);
        boolean isReapply = roleApplyService.apply(userId, BusinessRole.Code.TRAINER);
        Trainer trainer = saveOrUpdateMainTable(userId, request);
        // 一次性持久化擅长行业 / 擅长领域 / 著作，避免分步调用受 RequireRole(TRAINER active) 拦截
        replaceExpertiseCategoriesByIds(trainer.getId(), request.getExpertiseCategoryIds());
        replaceIndustryCategoriesByIds(trainer.getId(), request.getIndustryCategoryIds());
        replaceBooks(trainer.getId(), request.getBooks());
        if (isReapply && oldSnapshot != null && changeLogService != null) {
            Trainer newSnapshot = trainerRepository.findByUserId(userId).orElse(null);
            if (newSnapshot != null) {
                String batch = RoleApplicationChangeLogService.batchKey(userId, BusinessRole.Code.TRAINER);
                changeLogService.recordChanges(userId, BusinessRole.Code.TRAINER, batch,
                        toTrainerFieldMap(oldSnapshot), toTrainerFieldMap(newSnapshot), TRAINER_FIELD_LABELS);
            }
        }
    }

    /** 整体替换擅长领域分类（apply / save 通用） */
    private void replaceExpertiseCategoriesByIds(Integer trainerId, List<Integer> categoryIds) {
        if (categoryIds == null) return;
        expertiseCategoryRepository.deleteByTrainerId(trainerId);
        if (categoryIds.isEmpty()) return;
        List<Integer> uniqueIds = categoryIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (uniqueIds.isEmpty()) return;
        int sort = uniqueIds.size();
        List<TrainerExpertiseCategory> entities = new ArrayList<>(uniqueIds.size());
        for (Integer cid : uniqueIds) {
            TrainerExpertiseCategory ec = new TrainerExpertiseCategory();
            ec.setTrainerId(trainerId);
            ec.setCategoryId(cid);
            ec.setSortOrder(sort--);
            entities.add(ec);
        }
        expertiseCategoryRepository.saveAll(entities);
    }

    /** 整体替换擅长行业分类（apply / save 通用） */
    private void replaceIndustryCategoriesByIds(Integer trainerId, List<Integer> categoryIds) {
        if (categoryIds == null) return;
        industryCategoryRepository.deleteByTrainerId(trainerId);
        if (categoryIds.isEmpty()) return;
        List<Integer> uniqueIds = categoryIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (uniqueIds.isEmpty()) return;
        int sort = uniqueIds.size();
        List<TrainerIndustryCategory> entities = new ArrayList<>(uniqueIds.size());
        for (Integer cid : uniqueIds) {
            TrainerIndustryCategory ic = new TrainerIndustryCategory();
            ic.setTrainerId(trainerId);
            ic.setCategoryId(cid);
            ic.setSortOrder(sort--);
            entities.add(ic);
        }
        industryCategoryRepository.saveAll(entities);
    }

    /** 整体替换著作（apply 时一次性提交，简单可靠） */
    private void replaceBooks(Integer trainerId, List<com.taoke.user.dto.trainerbook.SaveTrainerBookRequest> books) {
        if (books == null) return;
        trainerBookRepository.deleteByTrainerId(trainerId);
        if (books.isEmpty()) return;
        int sort = books.size();
        List<TrainerBook> entities = new ArrayList<>(books.size());
        for (com.taoke.user.dto.trainerbook.SaveTrainerBookRequest b : books) {
            if (b == null || b.getTitle() == null || b.getTitle().isBlank()) continue;
            TrainerBook tb = new TrainerBook();
            tb.setTrainerId(trainerId);
            tb.setTitle(b.getTitle());
            tb.setCoverUrl(b.getCoverUrl());
            tb.setPublisher(b.getPublisher());
            tb.setPublishDate(b.getPublishDate());
            tb.setDescription(b.getDescription());
            tb.setBuyUrl(b.getBuyUrl());
            tb.setSortOrder(b.getSortOrder() != null ? b.getSortOrder() : sort);
            sort--;
            entities.add(tb);
        }
        trainerBookRepository.saveAll(entities);
    }

    @Override
    public RoleApplicationStatusResponse getApplyStatus(Integer userId) {
        return roleApplyService.getStatus(userId, BusinessRole.Code.TRAINER);
    }

    // ==================== 子表整体替换式保存 ====================

    @Transactional
    @Override
    public List<TrainerEducationDTO> saveEducations(Integer userId, List<TrainerEducationDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        educationRepository.deleteByTrainerId(trainerId);
        List<TrainerEducation> entities = dtos.stream().map(dto -> {
            TrainerEducation entity = trainerMapper.toEducationEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        return trainerMapper.toEducationDTOList(educationRepository.saveAll(entities));
    }

    @Transactional
    @Override
    public List<TrainerWorkExperienceDTO> saveWorkExperiences(Integer userId, List<TrainerWorkExperienceDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        workExperienceRepository.deleteByTrainerId(trainerId);
        List<TrainerWorkExperience> entities = dtos.stream().map(dto -> {
            TrainerWorkExperience entity = trainerMapper.toWorkExperienceEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        return trainerMapper.toWorkExperienceDTOList(workExperienceRepository.saveAll(entities));
    }

    @Transactional
    @Override
    public List<TrainerHonorDTO> saveHonors(Integer userId, List<TrainerHonorDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        honorRepository.deleteByTrainerId(trainerId);
        List<TrainerHonor> entities = dtos.stream().map(dto -> {
            TrainerHonor entity = trainerMapper.toHonorEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        return trainerMapper.toHonorDTOList(honorRepository.saveAll(entities));
    }

    @Transactional
    @Override
    public List<CategoryRefDTO> saveExpertiseCategories(Integer userId, List<CategoryRefDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        expertiseCategoryRepository.deleteByTrainerId(trainerId);
        List<TrainerExpertiseCategory> entities = dtos.stream().map(dto -> {
            TrainerExpertiseCategory entity = trainerMapper.toExpertiseCategoryEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        List<CategoryRefDTO> result = trainerMapper.toExpertiseCategoryDTOList(
                expertiseCategoryRepository.saveAll(entities));
        fillCategoryNames(result);
        return result;
    }

    @Transactional
    @Override
    public List<CategoryRefDTO> saveIndustryCategories(Integer userId, List<CategoryRefDTO> dtos) {
        Integer trainerId = getRequiredTrainerId(userId);
        industryCategoryRepository.deleteByTrainerId(trainerId);
        List<TrainerIndustryCategory> entities = dtos.stream().map(dto -> {
            TrainerIndustryCategory entity = trainerMapper.toIndustryCategoryEntity(dto);
            entity.setTrainerId(trainerId);
            return entity;
        }).toList();
        List<CategoryRefDTO> result = trainerMapper.toIndustryCategoryDTOList(
                industryCategoryRepository.saveAll(entities));
        fillCategoryNames(result);
        return result;
    }

    // ==================== 内部方法 ====================

    /** 获取当前用户的 trainerId，不存在则抛异常 */
    private Integer getRequiredTrainerId(Integer userId) {
        return trainerRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "请先创建专家档案"))
                .getId();
    }

    /** 主表保存或更新 */
    private Trainer saveOrUpdateMainTable(Integer userId, TrainerRequest req) {
        Trainer trainer = trainerRepository.findByUserId(userId).orElseGet(() -> {
            Trainer t = new Trainer();
            t.setUserId(userId);
            return t;
        });

        if (req.getName() != null) trainer.setName(req.getName());
        if (req.getTeachingName() != null) trainer.setTeachingName(req.getTeachingName());
        // 头像统一写到 sys_users.avatar_url；trainer.avatar 字段不再写入（V65 后弃用）
        if (req.getAvatar() != null) {
            userRepository.findById(userId).ifPresent(u -> {
                u.setAvatarUrl(req.getAvatar());
                userRepository.save(u);
            });
        }
        if (req.getTitle() != null) trainer.setTitle(req.getTitle());
        if (req.getGender() != null) trainer.setGender(req.getGender());
        if (req.getPhone() != null) trainer.setPhone(req.getPhone());
        if (req.getEmail() != null) trainer.setEmail(req.getEmail());
        if (req.getPostCode() != null) trainer.setPostCode(req.getPostCode());
        if (req.getProvinceId() != null) trainer.setProvinceId(req.getProvinceId());
        if (req.getCityId() != null) trainer.setCityId(req.getCityId());
        if (req.getDistrictId() != null) trainer.setDistrictId(req.getDistrictId());
        if (req.getTownId() != null) trainer.setTownId(req.getTownId());
        if (req.getAddress() != null) trainer.setAddress(req.getAddress());
        if (req.getIdCardNo() != null) trainer.setIdCardNo(req.getIdCardNo());
        if (req.getBio() != null) trainer.setBio(req.getBio());
        if (req.getOneLineIntro() != null) trainer.setOneLineIntro(req.getOneLineIntro());
        if (req.getSeoDescription() != null) trainer.setSeoDescription(req.getSeoDescription());
        if (req.getIntro() != null) trainer.setIntro(req.getIntro());
        if (req.getBackground() != null) trainer.setBackground(req.getBackground());
        if (req.getPartialClients() != null) trainer.setPartialClients(req.getPartialClients());
        if (req.getGoodAt() != null) trainer.setGoodAt(req.getGoodAt());
        if (req.getSpecialties() != null) trainer.setSpecialties(req.getSpecialties());
        if (req.getExpertiseTags() != null) trainer.setExpertiseTags(req.getExpertiseTags());
        if (req.getTeachingStyle() != null) trainer.setTeachingStyle(req.getTeachingStyle());
        if (req.getExperienceYears() != null) trainer.setExperienceYears(req.getExperienceYears());
        if (req.getTeachingYears() != null) trainer.setTeachingYears(req.getTeachingYears());
        if (req.getServiceCityIds() != null) trainer.setServiceCityIds(req.getServiceCityIds());
        if (req.getQuoteMin() != null) trainer.setQuoteMin(req.getQuoteMin());
        if (req.getQuoteMax() != null) trainer.setQuoteMax(req.getQuoteMax());
        if (req.getQuoteUnit() != null) trainer.setQuoteUnit(req.getQuoteUnit());
        if (req.getQuoteRemark() != null) trainer.setQuoteRemark(req.getQuoteRemark());
        if (req.getTaokePrice() != null) trainer.setTaokePrice(req.getTaokePrice());
        if (req.getTaokeCommission() != null) trainer.setTaokeCommission(req.getTaokeCommission());
        if (req.getResumeUrl() != null) trainer.setResumeUrl(req.getResumeUrl());
        if (req.getBackgroundImage() != null) trainer.setBackgroundImage(req.getBackgroundImage());

        // 协议签署：首次勾选时回写时间与版本，已有签署时间时不重复覆盖
        if (Boolean.TRUE.equals(req.getAgreementSigned())) {
            if (trainer.getAgreementSignedAt() == null) {
                trainer.setAgreementSignedAt(java.time.LocalDateTime.now());
            }
            String version = req.getAgreementVersion();
            if (version == null || version.isBlank()) {
                version = "v1";
            }
            trainer.setAgreementVersion(version);
        }

        return trainerRepository.save(trainer);
    }

    /** 专家入驻/重审：请求未带头像时，若用户表亦无有效头像则拒绝。 */
    private void validateApplyAvatar(Integer userId, TrainerRequest request) {
        if (LegacyAvatarUrls.isUsableAvatar(request.getAvatar())) {
            return;
        }
        String existing = userRepository.findById(userId)
                .map(User::getAvatarUrl)
                .orElse(null);
        if (!LegacyAvatarUrls.isUsableAvatar(existing)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请上传专家头像");
        }
    }

    /**
     * 组装完整的 TrainerResponse（主表 + 五张子表）
     * <p>分步查询，避免 N+1；分类关联回填 categoryName</p>
     */
    private TrainerResponse assembleFullResponse(Trainer trainer) {
        TrainerResponse response = trainerMapper.toResponse(trainer);
        Integer trainerId = trainer.getId();

        response.setAvatar(resolveTrainerDisplayAvatar(trainer, loadUserAvatarMap(
                trainer.getUserId() != null ? List.of(trainer.getUserId()) : List.of())));

        response.setEducations(
                trainerMapper.toEducationDTOList(educationRepository.findByTrainerIdOrderBySortOrder(trainerId)));
        response.setWorkExperiences(
                trainerMapper.toWorkExperienceDTOList(workExperienceRepository.findByTrainerIdOrderBySortOrder(trainerId)));
        response.setHonors(
                trainerMapper.toHonorDTOList(honorRepository.findByTrainerIdOrderBySortOrder(trainerId)));

        List<CategoryRefDTO> expertiseList = trainerMapper.toExpertiseCategoryDTOList(
                expertiseCategoryRepository.findByTrainerIdOrderBySortOrder(trainerId));
        List<CategoryRefDTO> industryList = trainerMapper.toIndustryCategoryDTOList(
                industryCategoryRepository.findByTrainerIdOrderBySortOrder(trainerId));

        // 批量回填分类名称（两种关联合并一次查）
        fillCategoryNames(expertiseList, industryList);

        response.setExpertiseCategories(expertiseList);
        response.setIndustryCategories(industryList);

        return response;
    }

    /** 为公开响应填充子表数据 */
    private void fillSubTableData(TrainerPublicResponse response, Integer trainerId) {
        response.setEducations(
                trainerMapper.toEducationDTOList(educationRepository.findByTrainerIdOrderBySortOrder(trainerId)));
        response.setWorkExperiences(
                trainerMapper.toWorkExperienceDTOList(workExperienceRepository.findByTrainerIdOrderBySortOrder(trainerId)));
        response.setHonors(
                trainerMapper.toHonorDTOList(honorRepository.findByTrainerIdOrderBySortOrder(trainerId)));

        List<CategoryRefDTO> expertiseList = trainerMapper.toExpertiseCategoryDTOList(
                expertiseCategoryRepository.findByTrainerIdOrderBySortOrder(trainerId));
        List<CategoryRefDTO> industryList = trainerMapper.toIndustryCategoryDTOList(
                industryCategoryRepository.findByTrainerIdOrderBySortOrder(trainerId));

        fillCategoryNames(expertiseList, industryList);

        response.setExpertiseCategories(expertiseList);
        response.setIndustryCategories(industryList);
    }

    @Override
    public Page<Trainer> searchForAdmin(String search, Integer status, Pageable pageable) {
        Specification<Trainer> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("name"), like),
                        cb.like(root.get("title"), like),
                        cb.like(root.get("phone"), like)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return trainerRepository.findAll(spec, pageable);
    }

    @Override
    public List<Trainer> findByUserIds(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        Specification<Trainer> spec = (root, cq, cb) -> root.get("userId").in(userIds);
        return trainerRepository.findAll(spec);
    }

    @Override
    public List<Trainer> findByIds(Collection<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return trainerRepository.findByIdIn(ids);
    }

    @Override
    public List<Trainer> findPublishedByNames(Collection<String> names) {
        if (names == null || names.isEmpty()) {
            return List.of();
        }
        List<String> distinct = names.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        if (distinct.isEmpty()) {
            return List.of();
        }
        return trainerRepository.findByNameInAndStatus(distinct, 2);
    }

    @Override
    public boolean hasExpertiseCategoryReference(Integer categoryId) {
        return expertiseCategoryRepository.existsByCategoryId(categoryId);
    }

    @Override
    public boolean hasIndustryCategoryReference(Integer categoryId) {
        return industryCategoryRepository.existsByCategoryId(categoryId);
    }

    @Override
    @Transactional
    public void adjustCommentCountByUserId(Integer trainerUserId, int delta) {
        if (trainerUserId == null || delta == 0) return;
        trainerRepository.findByUserId(trainerUserId).ifPresent(t -> {
            int cur = t.getCommentCount() == null ? 0 : t.getCommentCount();
            int next = Math.max(0, cur + delta);
            t.setCommentCount(next);
            trainerRepository.save(t);
        });
    }

    @Override
    @Transactional
    public void updateReviewStatsByUserId(Integer trainerUserId, BigDecimal score, int commentCount) {
        if (trainerUserId == null) return;
        trainerRepository.findByUserId(trainerUserId).ifPresent(t -> {
            BigDecimal nextScore = (score == null ? BigDecimal.ZERO : score)
                    .setScale(2, RoundingMode.HALF_UP);
            t.setScore(nextScore);
            t.setCommentCount(Math.max(0, commentCount));
            trainerRepository.save(t);
            publicTrainerListCache.evictPublicListCaches();
        });
    }

    /** 列表/推荐位头像与详情一致：优先 sys_users.avatar_url */
    private Map<Integer, String> loadUserAvatarMap(Collection<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(userIds).stream()
                .filter(u -> u.getAvatarUrl() != null && !u.getAvatarUrl().isBlank())
                .collect(Collectors.toMap(User::getId, User::getAvatarUrl, (a, b) -> a));
    }

    /**
     * 专家展示头像：用户表优先，跳过旧站占位图，回退 trainer.avatar，再回退默认头像素材池。
     * <p>同时写入 {@code avatarFallback}（素材库默认），供前端在自定义头像 404 时回退。</p>
     */
    private void applyDisplayAvatar(TrainerListItemResponse item, Trainer trainer,
                                    Map<Integer, String> userAvatarMap) {
        AvatarResolve resolved = resolveTrainerDisplayAvatarPair(trainer, userAvatarMap);
        item.setAvatar(resolved.avatar());
        item.setAvatarFallback(resolved.fallback());
    }

    private void applyDisplayAvatar(TrainerPublicResponse response, Trainer trainer,
                                    Map<Integer, String> userAvatarMap) {
        AvatarResolve resolved = resolveTrainerDisplayAvatarPair(trainer, userAvatarMap);
        response.setAvatar(resolved.avatar());
        response.setAvatarFallback(resolved.fallback());
    }

    private record AvatarResolve(String avatar, String fallback) {}

    private AvatarResolve resolveTrainerDisplayAvatarPair(Trainer trainer,
                                                          Map<Integer, String> userAvatarMap) {
        if (trainer == null) {
            return new AvatarResolve("", "");
        }
        String userUrl = trainer.getUserId() != null && userAvatarMap != null
                ? userAvatarMap.get(trainer.getUserId())
                : null;
        String raw = firstNonBlankAvatar(userUrl, trainer.getAvatar());
        int seed = trainer.getId() != null ? trainer.getId() : 0;
        String material = opsMaterialResolver.pickDefaultMaterialUrl("AVATAR", null, "TRAINER", seed);
        if (material == null) {
            material = "";
        }
        String avatar = opsMaterialResolver.resolveAvatarUrl(raw, "TRAINER", true, seed);
        if (avatar == null || avatar.isBlank()) {
            avatar = material;
        }
        return new AvatarResolve(avatar, material);
    }

    private String resolveTrainerDisplayAvatar(Trainer trainer, Map<Integer, String> userAvatarMap) {
        return resolveTrainerDisplayAvatarPair(trainer, userAvatarMap).avatar();
    }

    private static String firstNonBlankAvatar(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate.trim();
            }
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Integer, String> resolveDisplayAvatars(Collection<Integer> trainerIds) {
        if (trainerIds == null || trainerIds.isEmpty()) {
            return Map.of();
        }
        List<Trainer> trainers = findByIds(trainerIds);
        if (trainers.isEmpty()) {
            return Map.of();
        }
        List<Integer> userIds = trainers.stream()
                .map(Trainer::getUserId)
                .filter(Objects::nonNull)
                .toList();
        Map<Integer, String> userAvatarMap = loadUserAvatarMap(userIds);
        return trainers.stream()
                .collect(Collectors.toMap(
                        Trainer::getId,
                        trainer -> resolveTrainerDisplayAvatar(trainer, userAvatarMap),
                        (a, b) -> a));
    }

    // ---- 变更日志辅助 ----

    static final Map<String, String> TRAINER_FIELD_LABELS = Map.<String, String>ofEntries(
            Map.entry("name", "真实姓名"),
            Map.entry("teachingName", "授课姓名"),
            Map.entry("title", "头衔"),
            Map.entry("gender", "性别"),
            Map.entry("phone", "联系电话"),
            Map.entry("email", "邮箱"),
            Map.entry("idCardNo", "身份证号"),
            Map.entry("oneLineIntro", "一句话介绍"),
            Map.entry("bio", "个人简介"),
            Map.entry("background", "从业背景"),
            Map.entry("partialClients", "服务过客户"),
            Map.entry("goodAt", "擅长领域"),
            Map.entry("expertiseTags", "擅长标签"),
            Map.entry("teachingStyle", "授课风格"),
            Map.entry("experienceYears", "从业年限"),
            Map.entry("teachingYears", "授课年限"),
            Map.entry("quoteMin", "最低报价"),
            Map.entry("quoteMax", "最高报价"),
            Map.entry("quoteUnit", "报价单位"),
            Map.entry("quoteRemark", "报价备注"),
            Map.entry("taokePrice", "淘课网售价"),
            Map.entry("taokeCommission", "合作课酬"),
            Map.entry("provinceId", "省份"),
            Map.entry("cityId", "城市"),
            Map.entry("districtId", "区县"),
            Map.entry("address", "详细地址")
    );

    private static Map<String, String> toTrainerFieldMap(Trainer t) {
        if (t == null) return Map.of();
        Map<String, String> m = new HashMap<>();
        putIf(m, "name", t.getName());
        putIf(m, "teachingName", t.getTeachingName());
        putIf(m, "title", t.getTitle());
        putIf(m, "gender", t.getGender());
        putIf(m, "phone", t.getPhone());
        putIf(m, "email", t.getEmail());
        putIf(m, "idCardNo", t.getIdCardNo());
        putIf(m, "oneLineIntro", t.getOneLineIntro());
        putIf(m, "bio", t.getBio());
        putIf(m, "background", t.getBackground());
        putIf(m, "partialClients", t.getPartialClients());
        putIf(m, "goodAt", t.getGoodAt());
        putIf(m, "expertiseTags", t.getExpertiseTags());
        putIf(m, "teachingStyle", t.getTeachingStyle());
        putIf(m, "experienceYears", t.getExperienceYears());
        putIf(m, "teachingYears", t.getTeachingYears());
        putIf(m, "quoteMin", t.getQuoteMin());
        putIf(m, "quoteMax", t.getQuoteMax());
        putIf(m, "quoteUnit", t.getQuoteUnit());
        putIf(m, "quoteRemark", t.getQuoteRemark());
        putIf(m, "taokePrice", t.getTaokePrice());
        putIf(m, "taokeCommission", t.getTaokeCommission());
        putIf(m, "provinceId", t.getProvinceId());
        putIf(m, "cityId", t.getCityId());
        putIf(m, "districtId", t.getDistrictId());
        putIf(m, "address", t.getAddress());
        return m;
    }

    private static void putIf(Map<String, String> m, String key, Object val) {
        if (val != null) m.put(key, String.valueOf(val));
    }

    /** 批量回填多个列表的 categoryName */
    @SafeVarargs
    private void fillCategoryNames(List<CategoryRefDTO>... lists) {
        Set<Integer> allIds = Stream.of(lists)
                .flatMap(Collection::stream)
                .map(CategoryRefDTO::getCategoryId)
                .collect(Collectors.toSet());

        if (allIds.isEmpty()) return;

        Map<Integer, String> nameMap = categoryService.getNameMap(allIds);
        for (List<CategoryRefDTO> list : lists) {
            for (CategoryRefDTO dto : list) {
                dto.setCategoryName(nameMap.get(dto.getCategoryId()));
            }
        }
    }
}
