package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Getter;

/**
 * taokevideo pxbmobile 播放解析结果（成功载荷或拒绝原因）。
 */
@Getter
@Builder
public class PxbLegacyMobilePlaybackResult {

    public enum RejectReason {
        NOT_FOUND,
        NOT_PURCHASED,
        EXPIRED,
        UNPAID,
        ZGX_UNAVAILABLE,
        PLAYBACK_FAILED
    }

    private final boolean success;
    private final RejectReason rejectReason;
    private final String rejectMessage;

    /** 老站 v_type */
    private final int vType;
    /** true：v_type 8–10 应返回 supplier.htm，而非 JSON */
    private final boolean supplierPage;
    private final String videoUrl;
    private final String poster;
    private final boolean online;
    private final long size;

    public static PxbLegacyMobilePlaybackResult reject(RejectReason reason, String message) {
        return PxbLegacyMobilePlaybackResult.builder()
                .success(false)
                .rejectReason(reason)
                .rejectMessage(message)
                .build();
    }

    public static PxbLegacyMobilePlaybackResult playback(int vType,
                                                         boolean supplierPage,
                                                         String videoUrl,
                                                         String poster,
                                                         boolean online,
                                                         long size) {
        return PxbLegacyMobilePlaybackResult.builder()
                .success(true)
                .vType(vType)
                .supplierPage(supplierPage)
                .videoUrl(videoUrl)
                .poster(poster != null ? poster : "")
                .online(online)
                .size(size)
                .build();
    }
}
