package com.taoke.course.service.video;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.common.service.CategoryService;
import com.taoke.course.api.VideoService;
import com.taoke.course.dto.video.*;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoChapter;
import com.taoke.course.entity.video.VideoSeries;
import com.taoke.course.enums.VideoStatus;
import com.taoke.course.enums.VideoType;
import com.taoke.course.mapper.VideoMapper;
import com.taoke.course.entity.video.VideoEnrollment;
import com.taoke.course.repository.video.VideoChapterRepository;
import com.taoke.course.repository.video.VideoEnrollmentRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.repository.video.VideoSeriesRepository;
import com.taoke.user.api.BindingAuthority;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.Trainer;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 录播课管理服务 — CRUD + 系列/章节管理 + 状态流转
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Service
@RequiredArgsConstructor
public class VideoServiceImpl implements VideoService {

    private final VideoRepository videoRepository;
    private final VideoSeriesRepository videoSeriesRepository;
    private final VideoChapterRepository videoChapterRepository;
    private final VideoEnrollmentRepository videoEnrollmentRepository;
    private final VideoMapper videoMapper;
    private final CategoryService categoryService;
    private final TrainerService trainerService;
    private final InstitutionService institutionService;
    private final BindingAuthority bindingAuthority;

    // ==================== C 端发布者操作 ====================

    @Transactional
    @Override
    public VideoDetailVO create(Integer publisherId, String publisherType, SaveVideoRequest request) {
        Video video = new Video();
        applyRequest(video, request);
        video.setPublisherId(publisherId);
        video.setPublisherType(publisherType);
        video.setStatus(VideoStatus.PENDING.getValue());

        if (BusinessRole.Code.TRAINER.equals(publisherType)) {
            bindTrainerId(video, publisherId);
        }

        video = videoRepository.save(video);

        // SINGLE 类型且有视频地址时，自动创建一个章节
        if (video.getVideoType() == VideoType.SINGLE
                && request.getVideoUrl() != null && !request.getVideoUrl().isBlank()) {
            VideoChapter chapter = new VideoChapter();
            chapter.setVideoId(video.getId());
            chapter.setSeriesId(0);
            chapter.setTitle(video.getTitle() + " - 章节1");
            chapter.setVideoUrl(request.getVideoUrl());
            chapter.setSortOrder(1);
            videoChapterRepository.save(chapter);
            refreshVideoStats(video.getId());
        }

        return assembleDetail(video);
    }

    @Transactional
    @Override
    public VideoDetailVO update(Integer videoId, Integer publisherId, SaveVideoRequest request) {
        Video video = getOwnedVideo(videoId, publisherId);
        assertEditable(video);
        applyRequest(video, request);
        video = videoRepository.save(video);
        return assembleDetail(video);
    }

    @Transactional
    @Override
    public void submitForReview(Integer videoId, Integer publisherId) {
        Video video = getOwnedVideo(videoId, publisherId);
        int status = video.getStatus();
        if (status != VideoStatus.DRAFT.getValue() && status != VideoStatus.REJECTED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅草稿或驳回状态的录播课可提交审核");
        }
        video.setStatus(VideoStatus.PENDING.getValue());
        videoRepository.save(video);
    }

    @Transactional
    @Override
    public void unpublish(Integer videoId, Integer publisherId) {
        Video video = getOwnedVideo(videoId, publisherId);
        if (video.getStatus() != VideoStatus.PUBLISHED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅已上架的录播课可下架");
        }
        video.setStatus(VideoStatus.UNPUBLISHED.getValue());
        videoRepository.save(video);
    }

    @Transactional
    @Override
    public void delete(Integer videoId, Integer publisherId) {
        Video video = getOwnedVideo(videoId, publisherId);
        int status = video.getStatus();
        if (status != VideoStatus.DRAFT.getValue() && status != VideoStatus.REJECTED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅草稿或驳回状态的录播课可删除");
        }
        videoChapterRepository.deleteByVideoId(videoId);
        videoSeriesRepository.deleteByVideoId(videoId);
        videoRepository.delete(video);
    }

    @Override
    public VideoDetailVO getDetailForPublisher(Integer videoId, Integer publisherId) {
        Video video = getOwnedVideo(videoId, publisherId);
        return assembleDetail(video);
    }

    @Override
    public PageResponse<VideoListItemVO> listByPublisher(Integer publisherId, String publisherType,
                                                          Integer status, String keyword,
                                                          int page, int size) {
        Specification<Video> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("publisherId"), publisherId));
            predicates.add(cb.equal(root.get("publisherType"), publisherType));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), like),
                        cb.like(root.get("keywords"), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Video> videoPage = videoRepository.findAll(spec, pageable);

        if (videoPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<VideoListItemVO> items = videoPage.getContent().stream()
                .map(this::toListItemVO)
                .toList();
        return PageResponse.of(items, videoPage.getTotalElements(), page, size);
    }

    // ==================== 访问权限 ====================

    @Override
    public VideoAccessVO checkAccess(Integer videoId, Integer userId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));

        VideoAccessVO vo = new VideoAccessVO();
        vo.setIsFree(video.getIsFree() == 1);
        vo.setIsOwner(userId != null && userId.equals(video.getPublisherId()));

        // 发布者本人可直接播放
        if (vo.getIsOwner()) {
            vo.setAccessible(true);
            vo.setEnrolled(false);
            return vo;
        }

        if (video.getIsFree() == 1) {
            vo.setAccessible(true);
            vo.setEnrolled(false);
            return vo;
        }

        // 查询是否有有效的报名记录（status=1 且未过期）
        Optional<VideoEnrollment> enrollment = videoEnrollmentRepository.findByVideoIdAndUserId(videoId, userId);
        if (enrollment.isPresent() && enrollment.get().getStatus() == 1) {
            VideoEnrollment e = enrollment.get();
            boolean notExpired = e.getExpiredAt() == null || e.getExpiredAt().isAfter(LocalDateTime.now());
            vo.setEnrolled(true);
            vo.setAccessible(notExpired);
        } else {
            vo.setEnrolled(false);
            vo.setAccessible(false);
        }
        return vo;
    }

    // ==================== 公开接口 ====================

    @Override
    public VideoDetailVO getPublicDetail(Integer videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        // TODO: 正式上线后恢复仅允许已上架(PUBLISHED)访问；当前测试阶段放开全部状态便于联调
        // if (video.getStatus() != VideoStatus.PUBLISHED.getValue()) {
        //     throw new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在");
        // }
        // 浏览量+1
        video.setViewCount(video.getViewCount() + 1);
        videoRepository.save(video);
        return assembleDetail(video);
    }

    @Override
    public PageResponse<VideoListItemVO> listPublic(Integer categoryId, Integer subCategoryId,
                                                     String keyword, String sortBy,
                                                     Integer institutionId,
                                                     int page, int size) {
        // 机构过滤：先反查机构 user_id，机构不存在直接返回空页
        final Integer institutionUserId;
        if (institutionId != null) {
            Integer resolved = resolveInstitutionUserId(institutionId);
            if (resolved == null) {
                return PageResponse.of(List.of(), 0, page, size);
            }
            institutionUserId = resolved;
        } else {
            institutionUserId = null;
        }

        Specification<Video> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), VideoStatus.PUBLISHED.getValue()));

            if (categoryId != null || subCategoryId != null) {
                Set<Integer> categoryFilterIds = new HashSet<>();
                if (categoryId != null && categoryId > 0) {
                    categoryFilterIds.add(categoryId);
                }
                if (subCategoryId != null && subCategoryId > 0) {
                    categoryFilterIds.add(subCategoryId);
                }
                if (!categoryFilterIds.isEmpty()) {
                    predicates.add(cb.or(
                            root.get("categoryId").in(categoryFilterIds),
                            root.get("subCategoryId").in(categoryFilterIds)
                    ));
                }
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), like),
                        cb.like(root.get("keywords"), like),
                        cb.like(root.get("teacherName"), like)
                ));
            }
            if (institutionUserId != null) {
                predicates.add(cb.equal(root.get("publisherType"), BusinessRole.Code.INSTITUTION));
                predicates.add(cb.equal(root.get("publisherId"), institutionUserId));
            }
            return predicates.isEmpty()
                    ? cb.conjunction()
                    : cb.and(predicates.toArray(Predicate[]::new));
        };

        Sort sort = resolvePublicSort(sortBy);
        PageRequest pageable = PageRequest.of(page - 1, size, sort);
        Page<Video> videoPage = videoRepository.findAll(spec, pageable);

        if (videoPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<VideoListItemVO> items = videoPage.getContent().stream()
                .map(this::toListItemVO)
                .toList();
        return PageResponse.of(items, videoPage.getTotalElements(), page, size);
    }

    @Override
    public Map<Integer, Long> countPublicByCategoryL1() {
        Map<Integer, Long> map = new HashMap<>();
        for (Object[] row : videoRepository.countPublishedByCategoryL1()) {
            if (row[0] == null) {
                continue;
            }
            long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            map.put(((Number) row[0]).intValue(), count);
        }
        return map;
    }

    @Override
    public PageResponse<VideoListItemVO> listByInstitution(Integer institutionId, int page, int size) {
        Integer institutionUserId = resolveInstitutionUserId(institutionId);
        if (institutionUserId == null) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        Specification<Video> spec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("status"), VideoStatus.PUBLISHED.getValue()),
                cb.equal(root.get("publisherType"), BusinessRole.Code.INSTITUTION),
                cb.equal(root.get("publisherId"), institutionUserId)
        );
        Sort sort = Sort.by(Sort.Direction.DESC, "publishedAt").and(Sort.by(Sort.Direction.DESC, "id"));
        PageRequest pageable = PageRequest.of(page - 1, size, sort);
        Page<Video> videoPage = videoRepository.findAll(spec, pageable);

        if (videoPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        List<VideoListItemVO> items = videoPage.getContent().stream()
                .map(this::toListItemVO)
                .toList();
        return PageResponse.of(items, videoPage.getTotalElements(), page, size);
    }

    @Override
    public List<VideoListItemVO> listInstitutionSidebarVideos(Integer institutionId) {
        Integer institutionUserId = resolveInstitutionUserId(institutionId);
        if (institutionUserId == null) {
            return List.of();
        }
        Specification<Video> spec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("status"), VideoStatus.PUBLISHED.getValue()),
                cb.equal(root.get("publisherType"), BusinessRole.Code.INSTITUTION),
                cb.equal(root.get("publisherId"), institutionUserId)
        );
        Sort sort = Sort.by(Sort.Direction.DESC, "publishedAt").and(Sort.by(Sort.Direction.DESC, "id"));
        PageRequest pageable = PageRequest.of(0, 6, sort);
        return videoRepository.findAll(spec, pageable).getContent().stream()
                .map(this::toListItemVO)
                .toList();
    }

    @Override
    public PageResponse<VideoListItemVO> listByTrainerUserId(Integer trainerUserId, int page, int size) {
        if (trainerUserId == null || trainerUserId <= 0) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        Specification<Video> spec = (root, cq, cb) -> cb.and(
                cb.equal(root.get("status"), VideoStatus.PUBLISHED.getValue()),
                cb.equal(root.get("publisherType"), BusinessRole.Code.TRAINER),
                cb.equal(root.get("publisherId"), trainerUserId)
        );
        Sort sort = Sort.by(Sort.Direction.DESC, "publishedAt").and(Sort.by(Sort.Direction.DESC, "id"));
        PageRequest pageable = PageRequest.of(page - 1, size, sort);
        Page<Video> videoPage = videoRepository.findAll(spec, pageable);
        if (videoPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }
        List<VideoListItemVO> items = videoPage.getContent().stream()
                .map(this::toListItemVO)
                .toList();
        return PageResponse.of(items, videoPage.getTotalElements(), page, size);
    }

    /** 根据机构 ID 反查 user_id；机构不存在返回 null。 */
    private Integer resolveInstitutionUserId(Integer institutionId) {
        if (institutionId == null) {
            return null;
        }
        List<Institution> insts = institutionService.findByIds(List.of(institutionId));
        return insts.isEmpty() ? null : insts.get(0).getUserId();
    }

    // ==================== 后台管理 ====================

    @Override
    public PageResponse<VideoListItemVO> listForAdmin(Integer status, String keyword, int page, int size) {
        Specification<Video> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), like),
                        cb.like(root.get("keywords"), like)
                ));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(Predicate[]::new));
        };

        PageRequest pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Video> videoPage = videoRepository.findAll(spec, pageable);

        if (videoPage.isEmpty()) {
            return PageResponse.of(List.of(), 0, page, size);
        }

        List<VideoListItemVO> items = videoPage.getContent().stream()
                .map(this::toListItemVO)
                .toList();
        return PageResponse.of(items, videoPage.getTotalElements(), page, size);
    }

    @Override
    public VideoDetailVO getAdminDetail(Integer videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        return assembleDetail(video);
    }

    @Transactional
    @Override
    public void approve(Integer videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        if (video.getStatus() != VideoStatus.PENDING.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅待审核状态的录播课可审核通过");
        }
        video.setStatus(VideoStatus.PUBLISHED.getValue());
        video.setPublishedAt(LocalDateTime.now());
        video.setRejectReason("");
        videoRepository.save(video);
    }

    @Transactional
    @Override
    public void reject(Integer videoId, String reason) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        if (video.getStatus() != VideoStatus.PENDING.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅待审核状态的录播课可驳回");
        }
        video.setStatus(VideoStatus.REJECTED.getValue());
        video.setRejectReason(reason);
        videoRepository.save(video);
    }

    @Transactional
    @Override
    public void adminUnpublish(Integer videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        if (video.getStatus() != VideoStatus.PUBLISHED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅已上架的录播课可下架");
        }
        video.setStatus(VideoStatus.UNPUBLISHED.getValue());
        videoRepository.save(video);
    }

    @Transactional
    @Override
    public void adminPublish(Integer videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        if (video.getStatus() != VideoStatus.UNPUBLISHED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅已下架的录播课可重新上架");
        }
        video.setStatus(VideoStatus.PUBLISHED.getValue());
        video.setPublishedAt(LocalDateTime.now());
        videoRepository.save(video);
    }

    @Transactional
    @Override
    public void feature(Integer videoId, String type) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        if ("pin".equals(type)) {
            // 列表置顶：取当前最大 sortOrder + 1，首次置顶为 99999
            Integer maxSort = videoRepository.findMaxSortOrder().orElse(0);
            video.setSortOrder(Math.max(maxSort + 1, 99999));
        } else {
            // 列表推荐
            video.setIsFeatured(1);
        }
        videoRepository.save(video);
    }

    @Transactional
    @Override
    public void unfeature(Integer videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        video.setIsFeatured(0);
        video.setSortOrder(0);
        videoRepository.save(video);
    }

    // ==================== 系列管理 ====================

    @Override
    public List<VideoSeriesVO> listSeries(Integer videoId, Integer publisherId) {
        getOwnedVideo(videoId, publisherId);
        List<VideoSeries> list = videoSeriesRepository.findByVideoIdOrderBySortOrderAsc(videoId);
        List<VideoSeriesVO> result = videoMapper.toSeriesVOList(list);

        // 填充每个系列的章节数
        for (VideoSeriesVO vo : result) {
            vo.setChapterCount(videoChapterRepository.countBySeriesId(vo.getId()));
        }
        return result;
    }

    @Transactional
    @Override
    public VideoSeriesVO createSeries(Integer videoId, Integer publisherId, SaveVideoSeriesRequest request) {
        getOwnedVideo(videoId, publisherId);

        VideoSeries series = new VideoSeries();
        series.setVideoId(videoId);
        series.setTitle(request.getTitle());
        series.setDescription(request.getDescription());
        series.setCoverUrl(request.getCoverUrl());
        series.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);

        series = videoSeriesRepository.save(series);
        VideoSeriesVO vo = videoMapper.toSeriesVO(series);
        vo.setChapterCount(0);
        return vo;
    }

    @Transactional
    @Override
    public VideoSeriesVO updateSeries(Integer videoId, Integer seriesId, Integer publisherId,
                                       SaveVideoSeriesRequest request) {
        getOwnedVideo(videoId, publisherId);
        VideoSeries series = videoSeriesRepository.findById(seriesId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "系列不存在"));
        if (!series.getVideoId().equals(videoId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "系列不属于此录播课");
        }

        series.setTitle(request.getTitle());
        if (request.getDescription() != null) series.setDescription(request.getDescription());
        if (request.getCoverUrl() != null) series.setCoverUrl(request.getCoverUrl());
        if (request.getSortOrder() != null) series.setSortOrder(request.getSortOrder());

        series = videoSeriesRepository.save(series);
        VideoSeriesVO vo = videoMapper.toSeriesVO(series);
        vo.setChapterCount(videoChapterRepository.countBySeriesId(seriesId));
        return vo;
    }

    @Transactional
    @Override
    public void deleteSeries(Integer videoId, Integer seriesId, Integer publisherId) {
        getOwnedVideo(videoId, publisherId);
        VideoSeries series = videoSeriesRepository.findById(seriesId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "系列不存在"));
        if (!series.getVideoId().equals(videoId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "系列不属于此录播课");
        }
        // 该系列下的章节变为独立章节
        List<VideoChapter> chapters = videoChapterRepository.findByVideoIdAndSeriesIdOrderBySortOrderAsc(videoId, seriesId);
        for (VideoChapter chapter : chapters) {
            chapter.setSeriesId(0);
        }
        videoChapterRepository.saveAll(chapters);
        videoSeriesRepository.delete(series);
    }

    // ==================== 章节管理 ====================

    @Override
    public List<VideoChapterVO> listChapters(Integer videoId, Integer publisherId, Integer seriesId) {
        getOwnedVideo(videoId, publisherId);
        List<VideoChapter> list;
        if (seriesId != null && seriesId > 0) {
            list = videoChapterRepository.findByVideoIdAndSeriesIdOrderBySortOrderAsc(videoId, seriesId);
        } else {
            list = videoChapterRepository.findByVideoIdOrderBySortOrderAsc(videoId);
        }
        return videoMapper.toChapterVOList(list);
    }

    @Transactional
    @Override
    public VideoChapterVO createChapter(Integer videoId, Integer publisherId, SaveVideoChapterRequest request) {
        getOwnedVideo(videoId, publisherId);

        VideoChapter chapter = new VideoChapter();
        chapter.setVideoId(videoId);
        applyChapterRequest(chapter, request);

        chapter = videoChapterRepository.save(chapter);
        refreshVideoStats(videoId);
        return videoMapper.toChapterVO(chapter);
    }

    @Transactional
    @Override
    public List<VideoChapterVO> batchCreateChapters(Integer videoId, Integer publisherId,
                                                     List<SaveVideoChapterRequest> requests) {
        getOwnedVideo(videoId, publisherId);
        List<VideoChapterVO> result = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            SaveVideoChapterRequest req = requests.get(i);
            VideoChapter chapter = new VideoChapter();
            chapter.setVideoId(videoId);
            applyChapterRequest(chapter, req);
            if (chapter.getSortOrder() == 0) {
                chapter.setSortOrder(i + 1);
            }
            chapter = videoChapterRepository.save(chapter);
            result.add(videoMapper.toChapterVO(chapter));
        }
        refreshVideoStats(videoId);
        return result;
    }

    @Transactional
    @Override
    public VideoChapterVO updateChapter(Integer videoId, Integer chapterId, Integer publisherId,
                                         SaveVideoChapterRequest request) {
        getOwnedVideo(videoId, publisherId);
        VideoChapter chapter = videoChapterRepository.findById(chapterId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "章节不存在"));
        if (!chapter.getVideoId().equals(videoId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "章节不属于此录播课");
        }

        applyChapterRequest(chapter, request);
        chapter = videoChapterRepository.save(chapter);
        refreshVideoStats(videoId);
        return videoMapper.toChapterVO(chapter);
    }

    @Transactional
    @Override
    public void deleteChapter(Integer videoId, Integer chapterId, Integer publisherId) {
        getOwnedVideo(videoId, publisherId);
        VideoChapter chapter = videoChapterRepository.findById(chapterId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "章节不存在"));
        if (!chapter.getVideoId().equals(videoId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "章节不属于此录播课");
        }
        videoChapterRepository.delete(chapter);
        refreshVideoStats(videoId);
    }

    // ==================== 内部方法 ====================

    private void applyRequest(Video video, SaveVideoRequest req) {
        video.setTitle(req.getTitle());
        if (req.getVideoType() != null) {
            video.setVideoType(VideoType.valueOf(req.getVideoType()));
        }
        if (req.getCategoryId() != null) video.setCategoryId(req.getCategoryId());
        if (req.getSubCategoryId() != null) video.setSubCategoryId(req.getSubCategoryId());
        if (req.getCoverUrl() != null) video.setCoverUrl(req.getCoverUrl());
        video.setIntro(req.getIntro());
        if (req.getVideoUrl() != null) video.setVideoUrl(req.getVideoUrl());
        if (req.getExternalUrl() != null) video.setExternalUrl(req.getExternalUrl());
        if (req.getTeacherName() != null) video.setTeacherName(req.getTeacherName());
        if (req.getTrainerId() != null) video.setTrainerId(req.getTrainerId());
        if (req.getPrice() != null) video.setPrice(req.getPrice());
        if (req.getOriginalPrice() != null) video.setOriginalPrice(req.getOriginalPrice());
        if (req.getIsFree() != null) video.setIsFree(req.getIsFree());
        if (req.getKeywords() != null) video.setKeywords(req.getKeywords());
    }

    private void applyChapterRequest(VideoChapter chapter, SaveVideoChapterRequest req) {
        if (req.getSeriesId() != null) chapter.setSeriesId(req.getSeriesId());
        chapter.setTitle(req.getTitle());
        if (req.getDescription() != null) chapter.setDescription(req.getDescription());
        if (req.getVideoUrl() != null) chapter.setVideoUrl(req.getVideoUrl());
        if (req.getCoverUrl() != null) chapter.setCoverUrl(req.getCoverUrl());
        if (req.getDuration() != null) chapter.setDuration(req.getDuration());
        if (req.getFileSize() != null) chapter.setFileSize(req.getFileSize());
        if (req.getSortOrder() != null) chapter.setSortOrder(req.getSortOrder());
        if (req.getIsPreview() != null) chapter.setIsPreview(req.getIsPreview());
    }

    /** 刷新录播课的冗余统计字段（总集数、总时长） */
    private void refreshVideoStats(Integer videoId) {
        Video video = videoRepository.findById(videoId).orElse(null);
        if (video == null) return;

        List<VideoChapter> chapters = videoChapterRepository.findByVideoIdOrderBySortOrderAsc(videoId);
        video.setTotalEpisodes(chapters.size());
        int totalDuration = chapters.stream().mapToInt(VideoChapter::getDuration).sum();
        video.setDuration(totalDuration);
        videoRepository.save(video);
    }

    private void bindTrainerId(Video video, Integer userId) {
        List<Trainer> trainers = trainerService.findByUserIds(List.of(userId));
        if (!trainers.isEmpty()) {
            video.setTrainerId(trainers.get(0).getId());
        }
    }

    private Video getOwnedVideo(Integer videoId, Integer operatorUserId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "录播课不存在"));
        if (video.getPublisherId().equals(operatorUserId)) {
            return video;
        }
        if (BusinessRole.Code.TRAINER.equals(video.getPublisherType())) {
            bindingAuthority.requireCanManageTrainer(operatorUserId, video.getPublisherId());
            return video;
        }
        throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作此录播课");
    }

    private void assertEditable(Video video) {
        int status = video.getStatus();
        if (status != VideoStatus.DRAFT.getValue() && status != VideoStatus.REJECTED.getValue()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "仅草稿或驳回状态的录播课可编辑");
        }
    }

    /** 组装录播课详情（含系列 + 章节 + 分类名） */
    private VideoDetailVO assembleDetail(Video video) {
        VideoDetailVO vo = videoMapper.toDetailVO(video);

        // 系列列表
        List<VideoSeries> seriesList = videoSeriesRepository.findByVideoIdOrderBySortOrderAsc(video.getId());
        List<VideoChapter> allChapters = videoChapterRepository.findByVideoIdOrderBySortOrderAsc(video.getId());

        // 按系列分组
        Map<Integer, List<VideoChapter>> chaptersBySeriesId = allChapters.stream()
                .collect(Collectors.groupingBy(VideoChapter::getSeriesId));

        List<VideoSeriesVO> seriesVOList = new ArrayList<>();
        for (VideoSeries series : seriesList) {
            VideoSeriesVO seriesVO = videoMapper.toSeriesVO(series);
            List<VideoChapter> seriesChapters = chaptersBySeriesId.getOrDefault(series.getId(), List.of());
            seriesVO.setChapters(videoMapper.toChapterVOList(seriesChapters));
            seriesVO.setChapterCount(seriesChapters.size());
            seriesVOList.add(seriesVO);
        }
        vo.setSeriesList(seriesVOList);

        // 不属于任何系列的独立章节（seriesId=0）
        List<VideoChapter> standalone = chaptersBySeriesId.getOrDefault(0, List.of());
        vo.setStandaloneChapters(videoMapper.toChapterVOList(standalone));

        // 分类名称
        Set<Integer> catIds = new HashSet<>();
        if (video.getCategoryId() != null && video.getCategoryId() > 0) catIds.add(video.getCategoryId());
        if (video.getSubCategoryId() != null && video.getSubCategoryId() > 0) catIds.add(video.getSubCategoryId());
        if (!catIds.isEmpty()) {
            Map<Integer, String> nameMap = categoryService.getNameMap(catIds);
            vo.setCategoryName(nameMap.get(video.getCategoryId()));
            vo.setSubCategoryName(nameMap.get(video.getSubCategoryId()));
        }

        // 讲师名称
        if (video.getTrainerId() != null && video.getTrainerId() > 0) {
            List<Trainer> trainers = trainerService.findByIds(Set.of(video.getTrainerId()));
            if (!trainers.isEmpty()) {
                vo.setTrainerName(trainers.get(0).getName());
            }
        }

        return vo;
    }

    private VideoListItemVO toListItemVO(Video video) {
        VideoListItemVO vo = videoMapper.toListItemVO(video);
        if (video.getCategoryId() != null && video.getCategoryId() > 0) {
            Map<Integer, String> nameMap = categoryService.getNameMap(Set.of(video.getCategoryId()));
            vo.setCategoryName(nameMap.get(video.getCategoryId()));
        }
        return vo;
    }

    private Sort resolvePublicSort(String sortBy) {
        if (sortBy == null || sortBy.isBlank() || "default".equals(sortBy)) {
            return Sort.by(Sort.Direction.DESC, "sortOrder")
                    .and(Sort.by(Sort.Direction.DESC, "publishedAt"))
                    .and(Sort.by(Sort.Direction.DESC, "id"));
        }
        return switch (sortBy) {
            case "price" -> Sort.by(Sort.Direction.ASC, "price")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "score" -> Sort.by(Sort.Direction.DESC, "score")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "time" -> Sort.by(Sort.Direction.DESC, "publishedAt")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "viewCount" -> Sort.by(Sort.Direction.DESC, "viewCount")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            case "studentCount" -> Sort.by(Sort.Direction.DESC, "studentCount")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            default -> Sort.by(Sort.Direction.DESC, "sortOrder")
                    .and(Sort.by(Sort.Direction.DESC, "publishedAt"))
                    .and(Sort.by(Sort.Direction.DESC, "id"));
        };
    }
}
