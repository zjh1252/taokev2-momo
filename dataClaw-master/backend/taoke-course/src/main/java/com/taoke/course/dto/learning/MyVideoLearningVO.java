package com.taoke.course.dto.learning;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 我的录播课学习项 VO — 用于"我的学习 / 录播课"列表
 *
 * @author Fangxinxin
 * @date 2026-04-09 10:30
 */
@Data
public class MyVideoLearningVO {

    /** 录播课 ID */
    private Integer videoId;

    /** 录播课标题 */
    private String title;

    /** 封面图 URL */
    private String coverUrl;

    /** 授课老师 */
    private String teacherName;

    /** 总集数 */
    private Integer totalEpisodes;

    /** 已完成章节数 */
    private Integer completedChapters;

    /** 整体进度 0~100 */
    private Integer progress;

    /** 是否已完成 */
    private Boolean completed;

    /** 上次观看的章节 ID */
    private Integer lastChapterId;

    /** 报名时间 */
    private LocalDateTime enrolledAt;

    /** 过期时间 */
    private LocalDateTime expiredAt;

    /** 最近观看时间 */
    private LocalDateTime lastWatchedAt;

    /** 实付金额 */
    private BigDecimal pricePaid;
}
