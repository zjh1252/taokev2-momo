package com.taoke.user.service.pxb;

import com.taoke.common.service.CategoryService;
import com.taoke.user.api.PxbLegacyTrainerQueryService;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerExpertiseCategory;
import com.taoke.user.repository.TrainerExpertiseCategoryRepository;
import com.taoke.user.repository.TrainerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PxbLegacyTrainerQueryServiceImpl implements PxbLegacyTrainerQueryService {

    private static final int TRAINER_STATUS_PUBLISHED = 2;

    private final TrainerRepository trainerRepository;
    private final TrainerExpertiseCategoryRepository expertiseCategoryRepository;
    private final CategoryService categoryService;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public Map<Integer, Map<String, Object>> searchByName(String trainerName, int limit, boolean accurate) {
        if (!StringUtils.hasText(trainerName)) {
            return Map.of();
        }
        int safeLimit = Math.max(1, Math.min(limit, 50));
        String keyword = trainerName.trim();

        Specification<Trainer> spec = (root, cq, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("status"), TRAINER_STATUS_PUBLISHED));
            if (accurate) {
                predicates.add(cb.equal(root.get("name"), keyword));
            } else {
                String like = "%" + keyword + "%";
                predicates.add(cb.like(root.get("name"), like));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };

        List<Trainer> trainers = trainerRepository.findAll(spec, PageRequest.of(0, safeLimit)).getContent();
        if (trainers.isEmpty()) {
            return Map.of();
        }

        List<Integer> trainerIds = trainers.stream().map(Trainer::getId).toList();
        List<Integer> userIds = trainers.stream().map(Trainer::getUserId).toList();

        Map<Integer, List<TrainerExpertiseCategory>> expertiseByTrainer = expertiseCategoryRepository
                .findByTrainerIdInOrderBySortOrder(trainerIds).stream()
                .collect(Collectors.groupingBy(TrainerExpertiseCategory::getTrainerId));

        List<Integer> categoryIds = expertiseByTrainer.values().stream()
                .flatMap(List::stream)
                .map(TrainerExpertiseCategory::getCategoryId)
                .distinct()
                .toList();
        Map<Integer, String> categoryNames = categoryService.getNameMap(categoryIds);

        Map<Integer, List<String>> featuredCourses = findFeaturedCourseTitles(userIds, safeLimit * 2);

        Map<Integer, Map<String, Object>> result = new LinkedHashMap<>();
        for (Trainer trainer : trainers) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", trainer.getUserId());
            row.put("roleid", trainer.getId());
            row.put("realname", trainer.getName());
            row.put("icon", normalizeIcon(trainer.getAvatar()));
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

    private static String normalizeIcon(String avatar) {
        if (!StringUtils.hasText(avatar)) {
            return "";
        }
        String trimmed = avatar.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        return trimmed;
    }

    private Map<Integer, List<String>> findFeaturedCourseTitles(Collection<Integer> publisherIds, int rowLimit) {
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
