package com.taoke.course.service.video;

import com.taoke.course.entity.video.VideoChapterProgress;

import java.util.List;

/**
 * 录播课学习进度计算工具。
 *
 * @author Fangxinxin
 * @date 2026-07-07 18:30
 */
public final class VideoLearningProgressCalculator {

    private VideoLearningProgressCalculator() {
    }

    public static int calculateOverallProgress(List<VideoChapterProgress> chapterProgressList,
                                                Integer totalEpisodes) {
        if (chapterProgressList == null || chapterProgressList.isEmpty()) {
            return 0;
        }

        int denominator = totalEpisodes != null && totalEpisodes > 0
                ? totalEpisodes
                : chapterProgressList.size();
        int progressSum = chapterProgressList.stream()
                .mapToInt(progress -> Boolean.TRUE.equals(progress.getCompleted())
                        ? 100
                        : clampProgress(progress.getProgress()))
                .sum();

        return clampProgress(progressSum / denominator);
    }

    public static int clampProgress(Integer progress) {
        if (progress == null) {
            return 0;
        }
        return Math.max(0, Math.min(100, progress));
    }
}
