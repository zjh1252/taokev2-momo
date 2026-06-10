package com.taoke.user.search;

import com.taoke.common.entity.Category;
import com.taoke.common.entity.Region;
import com.taoke.common.repository.CategoryRepository;
import com.taoke.common.repository.RegionRepository;
import com.taoke.common.search.BaseDocument;
import com.taoke.common.search.DocumentSyncProvider;
import com.taoke.user.entity.Trainer;
import com.taoke.user.entity.TrainerExpertiseCategory;
import com.taoke.user.entity.TrainerIndustryCategory;
import com.taoke.user.repository.TrainerExpertiseCategoryRepository;
import com.taoke.user.repository.TrainerIndustryCategoryRepository;
import com.taoke.user.repository.TrainerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 专家文档同步提供者 — 从 DB 查询讲师数据并构建 {@link TrainerDocument}。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TrainerDocumentProvider implements DocumentSyncProvider {

    private static final String DOC_TYPE = "trainer";
    /** 审核通过 */
    private static final int APPROVED = 2;

    private final TrainerRepository trainerRepository;
    private final RegionRepository regionRepository;
    private final TrainerExpertiseCategoryRepository expertiseCategoryRepository;
    private final TrainerIndustryCategoryRepository industryCategoryRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public String getDocType() {
        return DOC_TYPE;
    }

    @Override
    public List<? extends BaseDocument> fetchUpdatedSince(LocalDateTime since) {
        Specification<Trainer> spec = (root, query, cb) -> cb.and(
                cb.greaterThan(root.get("updatedAt"), since),
                cb.equal(root.get("status"), APPROVED)
        );
        List<Trainer> trainers = trainerRepository.findAll(spec);
        return buildDocuments(trainers);
    }

    @Override
    public List<Integer> fetchRemovedSince(LocalDateTime since) {
        Specification<Trainer> spec = (root, query, cb) -> cb.and(
                cb.greaterThan(root.get("updatedAt"), since),
                cb.notEqual(root.get("status"), APPROVED)
        );
        return trainerRepository.findAll(spec).stream()
                .map(Trainer::getId)
                .toList();
    }

    @Override
    public List<? extends BaseDocument> fetchAll() {
        Specification<Trainer> spec = (root, query, cb) ->
                cb.equal(root.get("status"), APPROVED);
        List<Trainer> trainers = trainerRepository.findAll(spec);
        return buildDocuments(trainers);
    }

    private List<TrainerDocument> buildDocuments(List<Trainer> trainers) {
        if (trainers.isEmpty()) {
            return List.of();
        }

        List<Integer> trainerIds = trainers.stream().map(Trainer::getId).toList();

        // 批量查关联的省市名称
        Set<Integer> regionIds = new HashSet<>();
        trainers.forEach(t -> {
            if (t.getProvinceId() != null && t.getProvinceId() > 0) {
                regionIds.add(t.getProvinceId());
            }
            if (t.getCityId() != null && t.getCityId() > 0) {
                regionIds.add(t.getCityId());
            }
        });
        Map<Integer, String> regionNameMap = Collections.emptyMap();
        if (!regionIds.isEmpty()) {
            regionNameMap = regionRepository.findAllById(regionIds).stream()
                    .collect(Collectors.toMap(Region::getId, Region::getName, (a, b) -> a));
        }

        // 批量查关联的擅长领域分类 ID
        List<TrainerExpertiseCategory> allExpCategories = expertiseCategoryRepository
                .findByTrainerIdInOrderBySortOrder(trainerIds);
        Map<Integer, List<Integer>> expertiseIdMap = allExpCategories.stream()
                .collect(Collectors.groupingBy(
                        TrainerExpertiseCategory::getTrainerId,
                        Collectors.mapping(TrainerExpertiseCategory::getCategoryId, Collectors.toList())
                ));

        // 批量查关联的擅长行业分类 ID
        List<TrainerIndustryCategory> allIndCategories = industryCategoryRepository
                .findByTrainerIdInOrderBySortOrder(trainerIds);
        Map<Integer, List<Integer>> industryIdMap = allIndCategories.stream()
                .collect(Collectors.groupingBy(
                        TrainerIndustryCategory::getTrainerId,
                        Collectors.mapping(TrainerIndustryCategory::getCategoryId, Collectors.toList())
                ));

        // 批量查全部分类名称
        Set<Integer> allCatIds = new HashSet<>();
        allExpCategories.forEach(ec -> allCatIds.add(ec.getCategoryId()));
        allIndCategories.forEach(ic -> allCatIds.add(ic.getCategoryId()));
        final Map<Integer, String> catNameMap = allCatIds.isEmpty()
                ? Collections.emptyMap()
                : categoryRepository.findByIdIn(allCatIds).stream()
                        .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));

        Map<Integer, String> finalRegionNameMap = regionNameMap;
        Map<Integer, String> finalCatNameMap = catNameMap;
        return trainers.stream()
                .map(t -> toDocument(t, finalRegionNameMap,
                        expertiseIdMap.getOrDefault(t.getId(), List.of()),
                        industryIdMap.getOrDefault(t.getId(), List.of()),
                        finalCatNameMap))
                .toList();
    }

    private TrainerDocument toDocument(Trainer trainer, Map<Integer, String> regionNameMap,
                                        List<Integer> expertiseCategoryIds,
                                        List<Integer> industryCategoryIds,
                                        Map<Integer, String> catNameMap) {
        TrainerDocument doc = new TrainerDocument();
        doc.setDocType(DOC_TYPE);
        doc.setId(trainer.getId());
        doc.setCreatedAt(trainer.getCreatedAt());
        doc.setUpdatedAt(trainer.getUpdatedAt());

        doc.setName(trainer.getName());
        doc.setAvatar(trainer.getAvatar());
        doc.setTitle(trainer.getTitle());
        doc.setBio(stripHtml(trainer.getBio()));
        doc.setIntro(stripHtml(trainer.getIntro()));
        doc.setGoodAt(trainer.getGoodAt());
        doc.setSpecialties(trainer.getSpecialties());
        doc.setExpertiseTags(trainer.getExpertiseTags());
        doc.setTeachingStyle(trainer.getTeachingStyle());

        doc.setExperienceYears(trainer.getExperienceYears());
        doc.setTeachingYears(trainer.getTeachingYears());
        doc.setCertLevel(trainer.getCertLevel());
        doc.setIsSigned(trainer.getIsSigned());
        doc.setIsRecommended(trainer.getIsRecommended());

        doc.setSortOrder(trainer.getSortOrder());
        doc.setScore(trainer.getScore());
        doc.setViewCount(trainer.getViewCount());
        doc.setApprovedAt(trainer.getApprovedAt());

        // 关联字段：省市 ID + 名称
        if (trainer.getProvinceId() != null && trainer.getProvinceId() > 0) {
            doc.setProvinceId(trainer.getProvinceId());
            doc.setProvinceName(regionNameMap.get(trainer.getProvinceId()));
        }
        if (trainer.getCityId() != null && trainer.getCityId() > 0) {
            doc.setCityId(trainer.getCityId());
            doc.setCityName(regionNameMap.get(trainer.getCityId()));
        }

        doc.setExpertiseCategoryIds(expertiseCategoryIds);
        doc.setExpertiseCategoryNames(expertiseCategoryIds.stream()
                .map(catNameMap::get)
                .filter(Objects::nonNull)
                .distinct()
                .toList());
        doc.setIndustryCategoryNames(industryCategoryIds.stream()
                .map(catNameMap::get)
                .filter(Objects::nonNull)
                .distinct()
                .toList());

        doc.buildDocId();
        return doc;
    }

    private static String stripHtml(String html) {
        if (html == null || html.isBlank()) {
            return null;
        }
        return html.replaceAll("<[^>]*>", "").replaceAll("&[a-zA-Z]+;", " ").trim();
    }
}
