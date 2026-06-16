package com.taoke.course.dto.video;

import lombok.Data;

import java.util.List;

/**
 * 系列介绍 — 视频包及包内录播课列表
 *
 * @author Fangxinxin
 * @date 2026-06-10 14:00
 */
@Data
public class VideoSeriesPackageVO {

    /** 系列/包名称，如「KSB 精品职场课程」 */
    private String packageName;

    private List<VideoSeriesItemVO> videos;
}
