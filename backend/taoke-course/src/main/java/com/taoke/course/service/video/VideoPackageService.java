package com.taoke.course.service.video;



import com.taoke.course.dto.video.VideoPurchaseOptionsVO;

import com.taoke.course.dto.video.VideoSeriesItemVO;

import com.taoke.course.dto.video.VideoSeriesPackageVO;

import com.taoke.course.entity.video.Video;

import com.taoke.course.entity.video.VideoPackageGroup;

import com.taoke.course.entity.video.VideoPackageLabel;

import com.taoke.course.entity.video.VideoPackageRelation;

import com.taoke.course.enums.VideoStatus;

import com.taoke.course.repository.video.VideoPackageGroupRepository;

import com.taoke.course.repository.video.VideoPackageLabelRepository;

import com.taoke.course.repository.video.VideoPackageRelationRepository;

import com.taoke.course.repository.video.VideoRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import java.math.BigDecimal;

import java.util.ArrayList;

import java.util.List;

import java.util.Map;

import java.util.Optional;

import java.util.function.Function;

import java.util.stream.Collectors;



/**

 * 录播课视频包（系列介绍）查询

 *

 * @author Fangxinxin

 * @date 2026-06-10 14:00

 */

@Service

@RequiredArgsConstructor

public class VideoPackageService {



    private final VideoPackageRelationRepository relationRepository;

    private final VideoPackageLabelRepository labelRepository;

    private final VideoPackageGroupRepository groupRepository;

    private final VideoRepository videoRepository;



    @Transactional(readOnly = true)

    public VideoPurchaseOptionsVO getPurchaseOptions(Integer videoId) {

        Video video = videoRepository.findById(videoId)

                .filter(v -> v.getStatus() == VideoStatus.PUBLISHED.getValue())

                .orElse(null);

        if (video == null) {

            return null;

        }



        VideoPurchaseOptionsVO vo = new VideoPurchaseOptionsVO();

        vo.setHasSeriesOption(false);

        fillSinglePurchaseOptions(vo, video);



        resolvePrimaryRelation(videoId).ifPresent(relation -> {

            VideoPackageGroup group = groupRepository

                    .findByPackageIdAndTopicIdAndParentId(

                            relation.getPackageId(), relation.getTopicId(), relation.getParentId())

                    .orElse(null);

            if (group == null || group.getVideoCount() <= 1) {

                return;

            }

            vo.setHasSeriesOption(true);

            vo.setSeriesProductId(group.getId());

            vo.setSeriesPackageName(group.getName());

            vo.setSeriesVideoCount(group.getVideoCount());

            vo.setSeriesPrice(group.getPrice());

            fillSeriesPurchaseOptions(vo, group);

        });



        return vo;

    }



    @Transactional(readOnly = true)

    public boolean hasSeriesPackage(Integer videoId) {

        return resolvePrimaryRelation(videoId).isPresent();

    }



    @Transactional(readOnly = true)

    public VideoSeriesPackageVO getSeriesPackage(Integer videoId) {

        VideoPackageRelation primary = resolvePrimaryRelation(videoId).orElse(null);

        if (primary == null) {

            return null;

        }



        List<VideoPackageRelation> groupRelations = relationRepository

                .findByPackageIdAndTopicIdAndParentIdOrderBySortOrderAscVideoIdAsc(

                        primary.getPackageId(), primary.getTopicId(), primary.getParentId());

        if (groupRelations.isEmpty()) {

            return null;

        }



        List<Integer> videoIds = groupRelations.stream()

                .map(VideoPackageRelation::getVideoId)

                .distinct()

                .toList();

        Map<Integer, Video> videoMap = videoRepository.findAllById(videoIds).stream()

                .filter(v -> v.getStatus() == VideoStatus.PUBLISHED.getValue())

                .collect(Collectors.toMap(Video::getId, Function.identity()));



        List<VideoSeriesItemVO> items = new ArrayList<>();

        for (VideoPackageRelation relation : groupRelations) {

            Video video = videoMap.get(relation.getVideoId());

            if (video == null) {

                continue;

            }

            VideoSeriesItemVO item = new VideoSeriesItemVO();

            item.setId(video.getId());

            item.setTitle(video.getTitle());

            item.setCoverUrl(video.getCoverUrl());

            item.setPrice(video.getPrice());

            item.setTeacherName(resolveTeacherName(video));

            item.setStudentCount(video.getStudentCount());

            items.add(item);

        }



        if (items.isEmpty()) {

            return null;

        }



        VideoSeriesPackageVO result = new VideoSeriesPackageVO();

        result.setPackageName(resolvePackageName(primary));

        result.setVideos(items);

        return result;

    }



    private void fillSinglePurchaseOptions(VideoPurchaseOptionsVO vo, Video video) {

        vo.setSinglePrice(video.getPrice());

        boolean unlimited = VideoPurchasePricing.isQuantityUnlimited(video.getPrice(), video.getCompanyPrice());

        vo.setSingleQuantityUnlimited(unlimited);

        if (unlimited) {

            vo.setSingleCompanyPrice(BigDecimal.ZERO);

            vo.setSingleMaxQuantity(0);

            return;

        }

        vo.setSingleCompanyPrice(video.getCompanyPrice());

        vo.setSingleMaxQuantity(VideoPurchasePricing.resolveMaxQuantity(

                video.getPrice(), video.getCompanyPrice(), video.getMaxPurchaseQty()));

    }



    private void fillSeriesPurchaseOptions(VideoPurchaseOptionsVO vo, VideoPackageGroup group) {

        boolean unlimited = VideoPurchasePricing.isQuantityUnlimited(group.getPrice(), group.getCompanyPrice());

        vo.setSeriesQuantityUnlimited(unlimited);

        if (unlimited) {

            vo.setSeriesCompanyPrice(BigDecimal.ZERO);

            vo.setSeriesMaxQuantity(0);

            return;

        }

        vo.setSeriesCompanyPrice(group.getCompanyPrice());

        vo.setSeriesMaxQuantity(VideoPurchasePricing.resolveMaxQuantity(

                group.getPrice(), group.getCompanyPrice(), group.getMaxPurchaseQty()));

    }



    private Optional<VideoPackageRelation> resolvePrimaryRelation(Integer videoId) {

        List<VideoPackageRelation> relations = relationRepository.findByVideoIdOrderByPrimaryDescIdAsc(videoId);

        if (relations.isEmpty()) {

            return Optional.empty();

        }

        VideoPackageRelation primary = relations.stream()

                .filter(r -> Boolean.TRUE.equals(r.getPrimary()))

                .findFirst()

                .orElse(relations.getFirst());



        long siblingCount = relationRepository

                .findByPackageIdAndTopicIdAndParentIdOrderBySortOrderAscVideoIdAsc(

                        primary.getPackageId(), primary.getTopicId(), primary.getParentId())

                .size();

        if (siblingCount <= 1) {

            return Optional.empty();

        }

        return Optional.of(primary);

    }



    private String resolvePackageName(VideoPackageRelation relation) {

        if (relation.getTopicId() != null && relation.getTopicId() > 0) {

            Optional<VideoPackageLabel> topicLabel = labelRepository.findById(relation.getTopicId());

            if (topicLabel.isPresent() && !topicLabel.get().getName().isBlank()) {

                return topicLabel.get().getName();

            }

        }

        if (relation.getParentId() != null && relation.getParentId() > 0) {

            Optional<VideoPackageLabel> parentLabel = labelRepository.findById(relation.getParentId());

            if (parentLabel.isPresent() && !parentLabel.get().getName().isBlank()) {

                return parentLabel.get().getName();

            }

        }

        return "系列课程";

    }



    private String resolveTeacherName(Video video) {

        if (video.getTeacherName() != null && !video.getTeacherName().isBlank()) {

            return video.getTeacherName();

        }

        return "佚名";

    }

}


