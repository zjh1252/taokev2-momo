package com.taoke.course.api;

import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.course.dto.pxb.PxbLegacyTopicRow;
import com.taoke.course.dto.pxb.PxbLegacyVideoRow;

import java.util.List;
import java.util.Map;

/**
 * 培训宝 legacy 视频包/专题查询。
 */
public interface PxbLegacyPackageQueryService {

    List<PxbLegacyTopicRow> listCourseTopics(boolean orderBySupplier);

    List<PxbLegacyTopicRow> applyTopicBuyState(Integer userId,
                                                List<PxbLegacyTopicRow> topics,
                                                Integer pxbRootId);

    long countTopicCourses(Integer packageId, Integer secondId);

    List<PxbLegacyVideoRow> listTopicCourses(Integer packageId,
                                             Integer secondId,
                                             int start,
                                             int perPage);

    List<Integer> listTopicCourseIds(Integer packageId, Integer secondId);

    long countSeriesVideosInPackage(Integer packageId);

    Map<Integer, PxbLegacyPurchaseInfo> findPurchaseInfoForVideos(Integer userId,
                                                                   List<Integer> videoIds,
                                                                   Integer pxbRootId);

    /** videoSupplierNext：同视频包内下一集录播课 ID，无则 0 */
    int findNextPackageVideoId(int videoId);
}
