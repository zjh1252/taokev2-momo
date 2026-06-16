package com.taoke.course.dto.video;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 系列介绍 — 视频包内单条录播课卡片
 *
 * @author Fangxinxin
 * @date 2026-06-10 14:00
 */
@Data
public class VideoSeriesItemVO {

    private Integer id;
    private String title;
    private String coverUrl;
    private BigDecimal price;
    private String teacherName;
    private Integer studentCount;
}
