package com.taoke.course.service.video;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.api.VideoSupplierAdminService;
import com.taoke.course.dto.video.*;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoSupplier;
import com.taoke.course.entity.video.VideoSupplierCategory;
import com.taoke.course.entity.video.VideoSupplierCategoryVideo;
import com.taoke.course.mapper.VideoMapper;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.repository.video.VideoSupplierCategoryRepository;
import com.taoke.course.repository.video.VideoSupplierCategoryVideoRepository;
import com.taoke.course.repository.video.VideoSupplierRepository;
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

import java.util.*;
import java.util.stream.Collectors;

/**
 * 录播课供应商管理实现
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Service
@RequiredArgsConstructor
public class VideoSupplierAdminServiceImpl implements VideoSupplierAdminService {

    private final VideoSupplierRepository supplierRepository;
    private final VideoSupplierCategoryRepository categoryRepository;
    private final VideoSupplierCategoryVideoRepository categoryVideoRepository;
    private final VideoRepository videoRepository;
    private final VideoMapper videoMapper;
    private final UserService userService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<VideoSupplierVO> listSuppliers(String keyword, Boolean enabled, int page, int size) {
        int safePage = Math.max(1, page);
        int safeSize = size <= 0 ? 10 : Math.min(size, 100);

        Specification<VideoSupplier> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (enabled != null) {
                predicates.add(cb.equal(root.get("enabled"), enabled));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.like(root.get("companyName"), like));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Page<VideoSupplier> supplierPage = supplierRepository.findAll(
                spec, PageRequest.of(safePage - 1, safeSize, Sort.by(Sort.Direction.DESC, "id")));

        if (supplierPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, safePage, safeSize);
        }

        List<VideoSupplier> suppliers = supplierPage.getContent();
        Map<Integer, String> userNameMap = userService.findAllByIds(
                        suppliers.stream().map(VideoSupplier::getUserId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, this::resolveUserName));

        List<VideoSupplierVO> items = suppliers.stream()
                .map(s -> toSupplierVO(s, userNameMap.get(s.getUserId())))
                .toList();

        return PageResponse.of(items, supplierPage.getTotalElements(), safePage, safeSize);
    }

    @Override
    @Transactional(readOnly = true)
    public VideoSupplierVO getSupplier(Integer id) {
        VideoSupplier supplier = getSupplierEntity(id);
        String userName = userService.findAllByIds(List.of(supplier.getUserId())).stream()
                .findFirst().map(this::resolveUserName).orElse("");
        return toSupplierVO(supplier, userName);
    }

    @Override
    @Transactional
    public VideoSupplierVO createSupplier(SaveVideoSupplierRequest request) {
        if (!userService.existsById(request.getUserId())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "用户不存在");
        }
        if (supplierRepository.existsByUserId(request.getUserId())) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "该用户已绑定供应商");
        }
        VideoSupplier supplier = new VideoSupplier();
        applySupplierRequest(supplier, request);
        supplier = supplierRepository.save(supplier);
        return toSupplierVO(supplier, resolveUserNameSafe(supplier.getUserId()));
    }

    @Override
    @Transactional
    public VideoSupplierVO updateSupplier(Integer id, SaveVideoSupplierRequest request) {
        VideoSupplier supplier = getSupplierEntity(id);
        if (!supplier.getUserId().equals(request.getUserId())
                && supplierRepository.existsByUserIdAndIdNot(request.getUserId(), id)) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "该用户已绑定其他供应商");
        }
        applySupplierRequest(supplier, request);
        supplier = supplierRepository.save(supplier);
        return toSupplierVO(supplier, resolveUserNameSafe(supplier.getUserId()));
    }

    @Override
    @Transactional
    public void deleteSupplier(Integer id) {
        VideoSupplier supplier = getSupplierEntity(id);
        categoryVideoRepository.deleteBySupplierId(id);
        categoryRepository.deleteBySupplierId(id);
        supplierRepository.delete(supplier);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VideoSupplierCategoryVO> listCategoryTree(Integer supplierId) {
        getSupplierEntity(supplierId);
        List<VideoSupplierCategory> all = categoryRepository.findBySupplierIdOrderBySortOrderAscIdAsc(supplierId);
        Map<Integer, Long> videoCountMap = all.stream()
                .collect(Collectors.toMap(
                        VideoSupplierCategory::getId,
                        c -> categoryVideoRepository.countByCategoryId(c.getId())));

        Map<Integer, List<VideoSupplierCategory>> byParent = all.stream()
                .collect(Collectors.groupingBy(VideoSupplierCategory::getParentId));

        return buildCategoryTree(byParent, videoCountMap, 0);
    }

    @Override
    @Transactional
    public VideoSupplierCategoryVO createCategory(Integer supplierId, SaveVideoSupplierCategoryRequest request) {
        getSupplierEntity(supplierId);
        VideoSupplierCategory category = new VideoSupplierCategory();
        category.setSupplierId(supplierId);
        applyCategoryRequest(category, request);
        category = categoryRepository.save(category);
        return toCategoryVO(category, 0L);
    }

    @Override
    @Transactional
    public VideoSupplierCategoryVO updateCategory(Integer supplierId, Integer categoryId,
                                                   SaveVideoSupplierCategoryRequest request) {
        VideoSupplierCategory category = getCategoryEntity(supplierId, categoryId);
        applyCategoryRequest(category, request);
        category = categoryRepository.save(category);
        return toCategoryVO(category, categoryVideoRepository.countByCategoryId(categoryId));
    }

    @Override
    @Transactional
    public void deleteCategory(Integer supplierId, Integer categoryId) {
        VideoSupplierCategory category = getCategoryEntity(supplierId, categoryId);
        long childCount = categoryRepository.countBySupplierIdAndParentId(supplierId, categoryId);
        if (childCount > 0) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请先删除子分类");
        }
        categoryVideoRepository.deleteByCategoryId(categoryId);
        categoryRepository.delete(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VideoListItemVO> listCategoryVideos(Integer supplierId, Integer categoryId) {
        getCategoryEntity(supplierId, categoryId);
        List<VideoSupplierCategoryVideo> relations =
                categoryVideoRepository.findBySupplierIdAndCategoryIdOrderBySortOrderAscIdAsc(supplierId, categoryId);
        if (relations.isEmpty()) {
            return List.of();
        }
        List<Integer> videoIds = relations.stream().map(VideoSupplierCategoryVideo::getVideoId).toList();
        Map<Integer, Video> videoMap = videoRepository.findAllById(videoIds).stream()
                .collect(Collectors.toMap(Video::getId, v -> v));
        return relations.stream()
                .map(r -> videoMap.get(r.getVideoId()))
                .filter(Objects::nonNull)
                .map(videoMapper::toListItemVO)
                .toList();
    }

    @Override
    @Transactional
    public void assignCategoryVideos(Integer supplierId, Integer categoryId,
                                      SaveSupplierCategoryVideoRequest request) {
        getCategoryEntity(supplierId, categoryId);
        categoryVideoRepository.deleteByCategoryId(categoryId);

        int index = 0;
        for (SaveSupplierCategoryVideoRequest.CategoryVideoItem item : request.getVideos()) {
            if (item.getVideoId() == null || item.getVideoId() <= 0) {
                continue;
            }
            if (!videoRepository.existsById(item.getVideoId())) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在: " + item.getVideoId());
            }
            VideoSupplierCategoryVideo rel = new VideoSupplierCategoryVideo();
            rel.setSupplierId(supplierId);
            rel.setCategoryId(categoryId);
            rel.setVideoId(item.getVideoId());
            rel.setSortOrder(item.getSortOrder() != null && item.getSortOrder() > 0
                    ? item.getSortOrder() : index + 1);
            categoryVideoRepository.save(rel);
            index++;
        }
    }

    @Override
    @Transactional
    public void removeCategoryVideo(Integer supplierId, Integer categoryId, Integer videoId) {
        getCategoryEntity(supplierId, categoryId);
        VideoSupplierCategoryVideo rel = categoryVideoRepository.findByCategoryIdAndVideoId(categoryId, videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "关联不存在"));
        if (!rel.getSupplierId().equals(supplierId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作");
        }
        categoryVideoRepository.delete(rel);
    }

    private List<VideoSupplierCategoryVO> buildCategoryTree(Map<Integer, List<VideoSupplierCategory>> byParent,
                                                             Map<Integer, Long> videoCountMap,
                                                             Integer parentId) {
        return byParent.getOrDefault(parentId, List.of()).stream().map(c -> {
            VideoSupplierCategoryVO vo = toCategoryVO(c, videoCountMap.getOrDefault(c.getId(), 0L));
            vo.setChildren(buildCategoryTree(byParent, videoCountMap, c.getId()));
            return vo;
        }).toList();
    }

    private VideoSupplier getSupplierEntity(Integer id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "供应商不存在"));
    }

    private VideoSupplierCategory getCategoryEntity(Integer supplierId, Integer categoryId) {
        VideoSupplierCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "分类不存在"));
        if (!category.getSupplierId().equals(supplierId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "分类不属于该供应商");
        }
        return category;
    }

    private void applySupplierRequest(VideoSupplier supplier, SaveVideoSupplierRequest request) {
        supplier.setUserId(request.getUserId());
        supplier.setCompanyName(request.getCompanyName().trim());
        if (request.getMemberType() != null && !request.getMemberType().isBlank()) {
            supplier.setMemberType(request.getMemberType().trim());
        }
        if (request.getEnabled() != null) {
            supplier.setEnabled(request.getEnabled());
        }
    }

    private void applyCategoryRequest(VideoSupplierCategory category, SaveVideoSupplierCategoryRequest request) {
        category.setParentId(request.getParentId() != null ? request.getParentId() : 0);
        category.setName(request.getName().trim());
        if (request.getSortOrder() != null) {
            category.setSortOrder(request.getSortOrder());
        }
        category.setTotalPrice(request.getTotalPrice());
        if (request.getDiscountRate() != null) {
            category.setDiscountRate(request.getDiscountRate());
        }
        if (request.getEnabled() != null) {
            category.setEnabled(request.getEnabled());
        }
    }

    private VideoSupplierVO toSupplierVO(VideoSupplier supplier, String userName) {
        VideoSupplierVO vo = new VideoSupplierVO();
        vo.setId(supplier.getId());
        vo.setUserId(supplier.getUserId());
        vo.setUserName(userName);
        vo.setCompanyName(supplier.getCompanyName());
        vo.setMemberType(supplier.getMemberType());
        vo.setEnabled(supplier.getEnabled());
        vo.setCreatedAt(supplier.getCreatedAt());
        vo.setUpdatedAt(supplier.getUpdatedAt());
        return vo;
    }

    private VideoSupplierCategoryVO toCategoryVO(VideoSupplierCategory category, Long videoCount) {
        VideoSupplierCategoryVO vo = new VideoSupplierCategoryVO();
        vo.setId(category.getId());
        vo.setSupplierId(category.getSupplierId());
        vo.setParentId(category.getParentId());
        vo.setName(category.getName());
        vo.setSortOrder(category.getSortOrder());
        vo.setTotalPrice(category.getTotalPrice());
        vo.setDiscountRate(category.getDiscountRate());
        vo.setEnabled(category.getEnabled());
        vo.setVideoCount(videoCount);
        return vo;
    }

    private String resolveUserNameSafe(Integer userId) {
        return userService.findAllByIds(List.of(userId)).stream()
                .findFirst().map(this::resolveUserName).orElse("UID:" + userId);
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
