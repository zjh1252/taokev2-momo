package com.taoke.user.service.pxb;

import com.taoke.common.entity.Category;
import com.taoke.common.enums.CategoryType;
import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.LegacyStaticAssetUrlResolver;
import com.taoke.user.api.PxbLegacyTrainerQueryService;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerExpertiseCategory;
import com.taoke.user.entity.TrainerIndustryCategory;
import com.taoke.user.entity.User;
import com.taoke.user.repository.TrainerExpertiseCategoryRepository;
import com.taoke.user.repository.TrainerIndustryCategoryRepository;
import com.taoke.user.repository.TrainerRepository;
import com.taoke.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PxbLegacyTrainerQueryServiceImpl implements PxbLegacyTrainerQueryService {

    private static final int TRAINER_STATUS_PUBLISHED = 2;
    private static final int LIST_CANDIDATE_LIMIT = 100;
    private static final int DEFAULT_PICK_COUNT = 6;

    private final TrainerRepository trainerRepository;
    private final TrainerExpertiseCategoryRepository expertiseCategoryRepository;
    private final TrainerIndustryCategoryRepository industryCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final LegacyStaticAssetUrlResolver legacyStaticAssetUrlResolver;

    @Override
    public Map<Integer, Map<String, Object>> searchByName(String trainerName, int limit, boolean accurate) {
        if (!StringUtils.hasText(trainerName)) {
            return Map.of();
        }
        int safeLimit = Math.max(1, Math.min(limit, 50));
        List<Trainer> trainers = trainerRepository.findAll(
                nameSpec(trainerName.trim(), accurate),
                PageRequest.of(0, safeLimit)).getContent();
        if (trainers.isEmpty()) {
            return Map.of();
        }
        return buildTrainerMap(trainers, accurate);
    }

    @Override
    public List<Map<String, Object>> listTrainersForPxb(String trade,
                                                       String keyword,
                                                       String extKeyword,
                                                       int pickCount) {
        int safePick = pickCount > 0 ? pickCount : DEFAULT_PICK_COUNT;
        Integer industryId = resolveTradeId(trade);
        String fullKeyword = joinKeywords(keyword, extKeyword);

        List<Trainer> candidates = queryListCandidates(industryId, fullKeyword, LIST_CANDIDATE_LIMIT);
        if (candidates.size() < safePick && industryId != null) {
            candidates = queryListCandidates(null, fullKeyword, LIST_CANDIDATE_LIMIT);
        }
        if (candidates.isEmpty()) {
            return List.of();
        }

        List<Trainer> picked = randomPick(candidates, safePick);
        List<Integer> trainerIds = picked.stream().map(Trainer::getId).toList();
        List<Integer> userIds = picked.stream().map(Trainer::getUserId).toList();

        Map<Integer, User> users = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));
        Map<Integer, List<TrainerExpertiseCategory>> expertiseByTrainer = loadExpertise(trainerIds);
        Map<Integer, List<TrainerIndustryCategory>> industryByTrainer = loadIndustry(trainerIds);
        Map<Integer, String> categoryNames = loadCategoryNames(expertiseByTrainer, industryByTrainer);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Trainer trainer : picked) {
            rows.add(toListRow(trainer, users.get(trainer.getUserId()),
                    expertiseByTrainer.getOrDefault(trainer.getId(), List.of()),
                    industryByTrainer.getOrDefault(trainer.getId(), List.of()),
                    categoryNames));
        }
        return rows;
    }

    @Override
    public Map<String, Object> getDetailByRoleId(int roleId) {
        if (roleId <= 0) {
            return Map.of();
        }
        Optional<Trainer> trainerOpt = trainerRepository.findById(roleId)
                .filter(t -> Objects.equals(t.getStatus(), TRAINER_STATUS_PUBLISHED));
        if (trainerOpt.isEmpty()) {
            return Map.of();
        }
        Trainer trainer = trainerOpt.get();

        List<TrainerExpertiseCategory> expertise = expertiseCategoryRepository
                .findByTrainerIdOrderBySortOrder(trainer.getId());
        Map<Integer, String> categoryNames = categoryService.getNameMap(
                expertise.stream().map(TrainerExpertiseCategory::getCategoryId).toList());

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", trainer.getUserId());
        row.put("roleid", trainer.getId());
        row.put("realname", trainer.getName());
        row.put("icon", legacyStaticAssetUrlResolver.resolve(trainer.getAvatar()));
        row.put("intro", trainer.getIntro() != null ? trainer.getIntro() : "");
        row.put("teaching_experience", trainer.getTeachingYears() != null ? trainer.getTeachingYears() : 0);

        String cates = expertise.stream()
                .map(TrainerExpertiseCategory::getCategoryId)
                .map(categoryNames::get)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.joining(","));
        row.put("cates", cates);
        row.put("course", findFeaturedCourses(trainer.getUserId()));
        return row;
    }

    private List<Trainer> queryListCandidates(Integer industryId, String keyword, int limit) {
        Specification<Trainer> spec = listSpec(industryId, keyword);
        Sort sort = Sort.by(Sort.Order.desc("isTrusted"), Sort.Order.desc("isSigned"),
                Sort.Order.desc("score"), Sort.Order.desc("sortOrder"), Sort.Order.desc("id"));
        return trainerRepository.findAll(spec, PageRequest.of(0, limit, sort)).getContent();
    }

    private Specification<Trainer> listSpec(Integer industryId, String keyword) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), TRAINER_STATUS_PUBLISHED));
            if (industryId != null && industryId > 0) {
                Subquery<Integer> sub = cq.subquery(Integer.class);
                Root<TrainerIndustryCategory> icRoot = sub.from(TrainerIndustryCategory.class);
                sub.select(icRoot.get("trainerId"))
                        .where(cb.equal(icRoot.get("categoryId"), industryId));
                predicates.add(root.get("id").in(sub));
            }
            if (StringUtils.hasText(keyword)) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("name"), like),
                        cb.like(root.get("teachingName"), like),
                        cb.like(root.get("goodAt"), like),
                        cb.like(root.get("expertiseTags"), like),
                        cb.like(root.get("oneLineIntro"), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<Trainer> nameSpec(String keyword, boolean accurate) {
        return (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), TRAINER_STATUS_PUBLISHED));
            if (accurate) {
                predicates.add(cb.equal(root.get("name"), keyword));
            } else {
                predicates.add(cb.like(root.get("name"), "%" + keyword + "%"));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Map<Integer, Map<String, Object>> buildTrainerMap(List<Trainer> trainers, boolean accurate) {
        List<Integer> trainerIds = trainers.stream().map(Trainer::getId).toList();
        List<Integer> userIds = trainers.stream().map(Trainer::getUserId).toList();
        Map<Integer, List<TrainerExpertiseCategory>> expertiseByTrainer = loadExpertise(trainerIds);
        Map<Integer, String> categoryNames = categoryService.getNameMap(
                expertiseByTrainer.values().stream().flatMap(List::stream)
                        .map(TrainerExpertiseCategory::getCategoryId).distinct().toList());
        Map<Integer, List<String>> featuredCourses = findFeaturedCourseTitles(userIds, trainers.size() * 2);

        Map<Integer, Map<String, Object>> result = new LinkedHashMap<>();
        for (Trainer trainer : trainers) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", trainer.getUserId());
            row.put("roleid", trainer.getId());
            row.put("realname", trainer.getName());
            row.put("icon", legacyStaticAssetUrlResolver.resolve(trainer.getAvatar()));
            row.put("intro", trainer.getBio() != null ? trainer.getBio() : "");

            List<TrainerExpertiseCategory> expertise = expertiseByTrainer.getOrDefault(trainer.getId(), List.of());
            String cates = expertise.stream()
                    .map(TrainerExpertiseCategory::getCategoryId)
                    .map(categoryNames::get)
                    .filter(StringUtils::hasText)
                    .distinct()
                    .collect(Collectors.joining(","));
            row.put("cates", cates);

            List<String> titles = featuredCourses.getOrDefault(trainer.getUserId(), List.of());
            row.put("course", String.join("_||_", titles));

            if (accurate) {
                row.put("signature", trainer.getOneLineIntro() != null ? trainer.getOneLineIntro() : "");
                BigDecimal score = trainer.getScore();
                if (score != null && score.compareTo(BigDecimal.ZERO) > 0) {
                    row.put("c_all_av", score);
                    row.put("c_all_av_Wid", score.multiply(BigDecimal.valueOf(20)).intValue());
                }
            }
            result.put(trainer.getUserId(), row);
        }
        return result;
    }

    private Map<String, Object> toListRow(Trainer trainer,
                                           User user,
                                           List<TrainerExpertiseCategory> expertise,
                                           List<TrainerIndustryCategory> industries,
                                           Map<Integer, String> categoryNames) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", trainer.getUserId());
        row.put("roleid", trainer.getId());
        row.put("nickname", user != null && StringUtils.hasText(user.getNickname()) ? user.getNickname() : "");
        row.put("username", user != null && StringUtils.hasText(user.getUsername()) ? user.getUsername() : "");
        row.put("icon", legacyStaticAssetUrlResolver.resolve(trainer.getAvatar()));
        row.put("company", trainer.getPartialClients() != null ? trainer.getPartialClients() : "");
        row.put("realname", trainer.getName());
        row.put("isrec", trainer.getIsRecommended() != null ? trainer.getIsRecommended() : 0);
        row.put("cid", expertise.stream()
                .map(TrainerExpertiseCategory::getCategoryId)
                .map(String::valueOf)
                .collect(Collectors.joining(",")));
        row.put("goodat", trainer.getGoodAt() != null ? trainer.getGoodAt() : "");
        row.put("trainingnum", trainer.getTeachingYears() != null ? trainer.getTeachingYears() : 0);
        row.put("commentnum", trainer.getCommentCount() != null ? trainer.getCommentCount() : 0);
        row.put("clicknum", trainer.getViewCount() != null ? trainer.getViewCount() : 0);
        row.put("score", trainer.getScore() != null ? trainer.getScore() : BigDecimal.ZERO);
        row.put("regtime", user != null && user.getCreatedAt() != null
                ? user.getCreatedAt().atZone(ZoneId.systemDefault()).toEpochSecond()
                : 0L);
        row.put("email", user != null && StringUtils.hasText(user.getEmail()) ? user.getEmail() : "");
        row.put("quality", (trainer.getIsSigned() != null && trainer.getIsSigned() > 0)
                || (trainer.getIsTrusted() != null && trainer.getIsTrusted() > 0) ? 1 : 0);
        row.put("signature", trainer.getOneLineIntro() != null ? trainer.getOneLineIntro() : "");
        row.put("ext_trade", industries.stream()
                .map(TrainerIndustryCategory::getCategoryId)
                .map(categoryNames::get)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.joining(",")));
        return row;
    }

    private List<Map<String, Object>> findFeaturedCourses(int publisherId) {
        String sql = """
                SELECT publisher_id AS organid, title FROM courses
                WHERE publisher_id = ? AND status = 2 AND is_featured = 1
                ORDER BY id DESC
                """;
        List<Map<String, Object>> courses = new ArrayList<>();
        jdbcTemplate.query(sql, rs -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("organid", rs.getInt("organid"));
            item.put("title", rs.getString("title"));
            courses.add(item);
        }, publisherId);
        return courses;
    }

    private Map<Integer, List<TrainerExpertiseCategory>> loadExpertise(List<Integer> trainerIds) {
        return expertiseCategoryRepository.findByTrainerIdInOrderBySortOrder(trainerIds).stream()
                .collect(Collectors.groupingBy(TrainerExpertiseCategory::getTrainerId));
    }

    private Map<Integer, List<TrainerIndustryCategory>> loadIndustry(List<Integer> trainerIds) {
        return industryCategoryRepository.findByTrainerIdInOrderBySortOrder(trainerIds).stream()
                .collect(Collectors.groupingBy(TrainerIndustryCategory::getTrainerId));
    }

    private Map<Integer, String> loadCategoryNames(Map<Integer, List<TrainerExpertiseCategory>> expertiseByTrainer,
                                                   Map<Integer, List<TrainerIndustryCategory>> industryByTrainer) {
        List<Integer> ids = new ArrayList<>();
        expertiseByTrainer.values().forEach(list -> list.forEach(e -> ids.add(e.getCategoryId())));
        industryByTrainer.values().forEach(list -> list.forEach(i -> ids.add(i.getCategoryId())));
        return categoryService.getNameMap(ids.stream().distinct().toList());
    }

    private Integer resolveTradeId(String trade) {
        if (!StringUtils.hasText(trade)) {
            return null;
        }
        String trimmed = trade.trim();
        if (trimmed.chars().allMatch(Character::isDigit)) {
            try {
                return Integer.parseInt(trimmed);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        List<Category> industries = categoryRepository.findByTypeOrderBySortOrder(
                CategoryType.TRAINER_INDUSTRY.name());
        for (String part : trimmed.split("\t")) {
            if (!StringUtils.hasText(part)) {
                continue;
            }
            for (Category category : industries) {
                if (part.trim().equals(category.getName())) {
                    return category.getId();
                }
            }
        }
        return null;
    }

    private static String joinKeywords(String keyword, String extKeyword) {
        if (StringUtils.hasText(keyword) && StringUtils.hasText(extKeyword)) {
            return keyword.trim() + " " + extKeyword.trim();
        }
        if (StringUtils.hasText(keyword)) {
            return keyword.trim();
        }
        return StringUtils.hasText(extKeyword) ? extKeyword.trim() : "";
    }

    private static List<Trainer> randomPick(List<Trainer> candidates, int pickCount) {
        List<Trainer> copy = new ArrayList<>(candidates);
        Collections.shuffle(copy);
        return copy.subList(0, Math.min(pickCount, copy.size()));
    }

    private Map<Integer, List<String>> findFeaturedCourseTitles(java.util.Collection<Integer> publisherIds,
                                                                 int rowLimit) {
        if (publisherIds == null || publisherIds.isEmpty()) {
            return Map.of();
        }
        String placeholders = publisherIds.stream().map(id -> "?").collect(Collectors.joining(","));
        String sql = """
                SELECT publisher_id, title FROM courses
                WHERE publisher_id IN (%s) AND status = 2 AND is_featured = 1
                ORDER BY publisher_id, id DESC
                LIMIT %d
                """.formatted(placeholders, Math.max(rowLimit, 1));

        Map<Integer, List<String>> grouped = new LinkedHashMap<>();
        jdbcTemplate.query(sql, rs -> {
            int publisherId = rs.getInt("publisher_id");
            grouped.computeIfAbsent(publisherId, k -> new ArrayList<>()).add(rs.getString("title"));
        }, publisherIds.toArray());
        return grouped;
    }
}
