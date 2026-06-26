package com.taoke.course.dto.video;

import lombok.Data;

/**
 * 章节第三方播放签发结果。
 *
 * @author Fangxinxin
 * @date 2026-06-11 10:00
 */
@Data
public class VideoChapterPlaybackVO {

    /** 播放地址（iframe src 或 mp4 直链） */
    private String embedUrl;

    /** 供应方：eceibs / kuaike / kuanxue / scho */
    private String provider;

    /** embed=iframe；direct=Video.js 直链 */
    private String playbackMode = "embed";
}
