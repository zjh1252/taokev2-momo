package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.RegionService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.trainer.*;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.entity.*;
import com.taoke.user.mapper.TrainerMapper;
import com.taoke.user.repository.*;
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

    private final TrainerRepository trainerRepository;
    private final TrainerEducationRepository educationRepository;
    private final TrainerWorkExperienceRepository workExperienceRepository;
    private final TrainerHonorRepository honorRepository;
    private final TrainerExpertiseCategoryRepository expertiseCategoryRepository;
    private final TrainerIndustryCategoryRepository industryCategoryRepository;
    private final TrainerMapper trainerMapper;
    private final RoleApplyService roleApplyService;
    private final CategoryService categoryService;
    private final RegionService regionService;

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
                                                            String keyword,
                                                            String sort) {
        // 构建排序
        Sort jpaSort = "score".equals(sort)
                ? Sort.by(Sort.Direction.DESC, "score").and(Sort.by(Sort.Direction.DESC, "id"))
                : Sort.by(Sort.Direction.DESC, "sortOrder")
                      .and(Sort.by(Sort.Direction.DESC, "score"))
                      .and(Sort.by(Sort.Direction.DESC, "id"));

        PageRequest pageable = PageRequest.of(page - 1, size, jpaSort);

        // 第一段：查分页 ID（带动态条件）
        Specification<Trainer> spec = buildListSpec(expertiseCategoryId, industryCategoryId, provinceId, keyword);
        Page<Trainer> trainerPage = trainerRepository.findAll(spec, pageable);

        if (trainerPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<Integer> trainerIds = trainerPage.getContent().stream().map(Trainer::getId).toList();

        // 第二段：回表查主表（已在 trainerPage.getContent() 中）
        Map<Integer, Trainer> trainerMap = trainerPage.getContent().stream()
                .collect(Collectors.toMap(Trainer::getId, Function.identity()));

        // 第三段：批量查擅长领域分类
        List<TrainerExpertiseCategory> allExpertise =
                expertiseCategoryRepository.findByTrainerIdInOrderBySortOrder(trainerIds);
        Map<Integer, List<TrainerExpertiseCategory>> expertiseMap = allExpertise.stream()
                .collect(Collectors.groupingBy(TrainerExpertiseCategory::getTrainerId));

        // 批量获取分类名称
        Set<Integer> categoryIds = allExpertise.stream()
                .map(TrainerExpertiseCategory::getCategoryId)
                .collect(Collectors.toSet());
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

        // 组装结果，保持 ID 原始顺序
        List<TrainerListItemResponse> items = trainerIds.stream().map(id -> {
            Trainer t = trainerMap.get(id);
            TrainerListItemResponse item = trainerMapper.toListItemResponse(t);

            List<CategoryRefDTO> catRefs = expertiseMap.getOrDefault(id, List.of()).stream().map(ec -> {
                CategoryRefDTO dto = new CategoryRefDTO();
                dto.setId(ec.getId());
                dto.setCategoryId(ec.getCategoryId());
                dto.setSortOrder(ec.getSortOrder());
                dto.setCategoryName(categoryNameMap.get(ec.getCategoryId()));
                return dto;
            }).toList();
            item.setExpertiseCategories(catRefs);

            // 填充省市名称
            item.setProvinceName(regionNameMap.get(t.getProvinceId()));
            item.setCityName(regionNameMap.get(t.getCityId()));

            return item;
        }).toList();

        return PageResponse.of(items, trainerPage.getTotalElements(), page, size);
    }

    /** 构建列表查询的动态条件 */
    private Specification<Trainer> buildListSpec(Integer expertiseCategoryId,
                                                 Integer industryCategoryId,
                                                 Integer provinceId,
                                                 String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), 2));

            if (provinceId != null) {
                predicates.add(cb.equal(root.get("provinceId"), provinceId));
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
                Subquery<Integer> sub = query.subquery(Integer.class);
                Root<TrainerExpertiseCategory> ecRoot = sub.from(TrainerExpertiseCategory.class);
                sub.select(ecRoot.get("trainerId"))
                   .where(cb.equal(ecRoot.get("categoryId"), expertiseCategoryId));
                predicates.add(root.get("id").in(sub));
            }

            if (industryCategoryId != null) {
                Subquery<Integer> sub = query.subquery(Integer.class);
                Root<TrainerIndustryCategory> icRoot = sub.from(TrainerIndustryCategory.class);
                sub.select(icRoot.get("trainerId"))
                   .where(cb.equal(icRoot.get("categoryId"), industryCategoryId));
                predicates.add(root.get("id").in(sub));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    @Override
    public TrainerPublicResponse getPublicProfile(Integer trainerId) {
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "专家不存在"));

        if (trainer.getStatus() != 2) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "专家不存在");
        }

        TrainerPublicResponse response = trainerMapper.toPublicResponse(trainer);
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

        // 组装列表项（不需要分类、地区名称，留空即可，前端只展示头像/姓名/头衔/评分）
        return trainers.stream().map(t -> {
            TrainerListItemResponse item = trainerMapper.toListItemResponse(t);
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
        roleApplyService.apply(userId, BusinessRole.Code.TRAINER);
        saveOrUpdateMainTable(userId, request);
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
        if (req.getAvatar() != null) trainer.setAvatar(req.getAvatar());
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
        if (req.getBio() != null) trainer.setBio(req.getBio());
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
        if (req.getBackgroundImage() != null) trainer.setBackgroundImage(req.getBackgroundImage());

        return trainerRepository.save(trainer);
    }

    /**
     * 组装完整的 TrainerResponse（主表 + 五张子表）
     * <p>分步查询，避免 N+1；分类关联回填 categoryName</p>
     */
    private TrainerResponse assembleFullResponse(Trainer trainer) {
        TrainerResponse response = trainerMapper.toResponse(trainer);
        Integer trainerId = trainer.getId();

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
    public boolean hasExpertiseCategoryReference(Integer categoryId) {
        return expertiseCategoryRepository.existsByCategoryId(categoryId);
    }

    @Override
    public boolean hasIndustryCategoryReference(Integer categoryId) {
        return industryCategoryRepository.existsByCategoryId(categoryId);
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
