package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.course.dto.pxb.PxbLegacyVideoRow;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * 培训宝 legacy API 专用录播课查询（跨模块契约）。
 */
public interface PxbLegacyVideoQueryService {

    /**
     * 分页搜索已上架录播课（ctype=3 courseList）。
     */
    PageResponse<PxbLegacyVideoRow> searchPublishedVideos(Integer categoryId,
                                                          String keyword,
                                                          String orderBy,
                                                          String sort,
                                                          int page,
                                                          int size);

    /**
     * 按 ID 批量查询已上架录播课，保持请求顺序。
     */
    List<PxbLegacyVideoRow> findPublishedVideosByIds(Collection<Integer> videoIds);

    /**
     * 用户已购且订单有效的录播课 ID（courseOrder，ctype=3）。
     * 返回 course_id → course_id 映射，对齐老站 PHP 数组。
     */
    Map<Integer, Integer> findPurchasedVideoIdMap(Integer userId,
                                                   Integer categoryId,
                                                   String keyword,
                                                   Integer pxbRootId);

    /**
     * 批量查询用户对指定录播课的购买信息（prehandleCourses buystatus）。
     */
    Map<Integer, PxbLegacyPurchaseInfo> findPurchaseInfoByVideoIds(Integer userId,
                                                                    Collection<Integer> videoIds,
                                                                    Integer pxbRootId);

    /** adsList：推荐录播课，以 id 为 key 的映射在 legacy 层组装 */
    List<PxbLegacyVideoRow> listVideoAds(int limit);

    /** getAccountBuyVideos：当前有效已购录播课 ID 列表 */
    List<Integer> findActivePurchasedVideoIds(Integer userId, Integer pxbRootId);

    /** VideoDetail opt 的 msg 载荷（含 buy_status、video） */
    Map<String, Object> buildVideoDetailMessage(Integer userId, Integer videoId, Integer pxbRootId);

    /** taokevideo pxbmobile 播放数据 */
    Map<String, Object> resolveMobilePlayback(Integer userId,
                                                Integer videoId,
                                                Integer chapterId,
                                                Integer pxbRootId);

    /** 并发观看上限（0 表示不限） */
    int resolvePlaybackConcurrencyLimit(Integer userId, Integer videoId);
}
