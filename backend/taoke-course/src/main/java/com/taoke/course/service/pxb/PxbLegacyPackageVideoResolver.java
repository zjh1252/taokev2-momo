package com.taoke.course.service.pxb;

import com.taoke.course.entity.video.VideoPackageRelation;
import com.taoke.course.repository.video.VideoPackageRelationRepository;

import java.util.List;

/**
 * 培训宝 legacy：从 video_package_groups 节点字段解析包内已发布视频 ID。
 * 对齐 {@code getTopicCourses} / {@code collectVideoIds} 的 parent_id 语义。
 */
public final class PxbLegacyPackageVideoResolver {

    private PxbLegacyPackageVideoResolver() {
    }

    /**
     * @param packageId 专题头 ID（老站 tk_video_topic.id）
     * @param topicId   系列节点 ID（老站 item.id）；专题头行为 0
     * @param parentId  父节点 ID（老站 item_parent）；顶级包为 0
     */
    public static List<Integer> resolvePublishedVideoIds(VideoPackageRelationRepository relationRepository,
                                                         int packageId,
                                                         int topicId,
                                                         int parentId) {
        List<VideoPackageRelation> relations = relationRepository
                .findByPackageIdAndTopicIdAndParentIdOrderBySortOrderAscVideoIdAsc(
                        packageId, topicId, parentId);
        if (!relations.isEmpty()) {
            return relations.stream()
                    .map(VideoPackageRelation::getVideoId)
                    .distinct()
                    .toList();
        }

        // 与 getTopicCoursesNumByCondition 一致：r.parentId = legacy 包/系列 ID
        int legacyParentId = parentId > 0 ? parentId : topicId;
        if (legacyParentId <= 0) {
            legacyParentId = packageId;
        }
        int legacyTopicFilter = parentId > 0 && topicId > 0 ? topicId : 0;
        return relationRepository.findPublishedVideoIdsByPackage(legacyParentId, legacyTopicFilter);
    }
}
