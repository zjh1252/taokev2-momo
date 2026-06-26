package com.taoke.course.service.video;

import com.taoke.course.dto.video.VideoProgressVO;
import com.taoke.course.entity.video.VideoChapterProgress;
import com.taoke.course.entity.video.VideoStudent;
import com.taoke.course.entity.video.Video;
import com.taoke.course.repository.video.VideoChapterProgressRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.repository.video.VideoStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 录播课学习进度服务
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:00
 */
@Service
@RequiredArgsConstructor
public class VideoProgressService {

    private final VideoChapterProgressRepository chapterProgressRepository;
    private final VideoStudentRepository videoStudentRepository;
    private final VideoRepository videoRepository;

    /**
     * 上报章节播放进度
     */
    @Transactional
    public void updateProgress(Integer videoId, Integer chapterId, Integer userId,
                               Integer watchDuration, Integer chapterDuration) {
        LocalDateTime now = LocalDateTime.now();

        // 更新/创建章节进度
        Optional<VideoChapterProgress> optCp = chapterProgressRepository.findByChapterIdAndUserId(chapterId, userId);
        VideoChapterProgress cp;
        if (optCp.isPresent()) {
            cp = optCp.get();
            cp.setWatchDuration(watchDuration);
            cp.setChapterDuration(chapterDuration);
            cp.setLastWatchedAt(now);
        } else {
            cp = new VideoChapterProgress();
            cp.setVideoId(videoId);
            cp.setChapterId(chapterId);
            cp.setUserId(userId);
            cp.setWatchDuration(watchDuration);
            cp.setChapterDuration(chapterDuration);
            cp.setStartedAt(now);
            cp.setLastWatchedAt(now);
        }

        // 计算章节进度百分比
        int progress = chapterDuration > 0
                ? Math.min(100, (int) ((long) watchDuration * 100 / chapterDuration))
                : 0;
        cp.setProgress(progress);

        // 看完判定（进度>=95%视为完成）
        if (progress >= 95 && !Boolean.TRUE.equals(cp.getCompleted())) {
            cp.setCompleted(true);
            cp.setCompletedAt(now);
        }
        chapterProgressRepository.save(cp);

        // 更新 video_students 汇总记录
        updateVideoStudent(videoId, chapterId, userId, now);
    }

    /**
     * 获取学习进度
     */
    public VideoProgressVO getProgress(Integer videoId, Integer userId) {
        VideoProgressVO vo = new VideoProgressVO();

        Optional<VideoStudent> optStudent = videoStudentRepository.findByVideoIdAndUserId(videoId, userId);
        if (optStudent.isPresent()) {
            VideoStudent student = optStudent.get();
            vo.setOverallProgress(student.getProgress());
            vo.setLastChapterId(student.getLastChapterId());
            vo.setTotalWatchTime(student.getTotalWatchTime());
            vo.setLastWatchedAt(student.getLastWatchedAt());
        } else {
            vo.setOverallProgress(0);
            vo.setLastChapterId(0);
            vo.setTotalWatchTime(0);
        }

        List<VideoChapterProgress> cpList = chapterProgressRepository.findByVideoIdAndUserId(videoId, userId);
        List<VideoProgressVO.ChapterProgressItem> items = cpList.stream().map(cp -> {
            VideoProgressVO.ChapterProgressItem item = new VideoProgressVO.ChapterProgressItem();
            item.setChapterId(cp.getChapterId());
            item.setWatchDuration(cp.getWatchDuration());
            item.setChapterDuration(cp.getChapterDuration());
            item.setProgress(cp.getProgress());
            item.setCompleted(cp.getCompleted());
            item.setLastWatchedAt(cp.getLastWatchedAt());
            return item;
        }).toList();
        vo.setChapters(items);

        return vo;
    }

    /**
     * 汇总各章节进度到 video_students 记录
     */
    private void updateVideoStudent(Integer videoId, Integer chapterId, Integer userId, LocalDateTime now) {
        List<VideoChapterProgress> allProgress = chapterProgressRepository.findByVideoIdAndUserId(videoId, userId);

        int totalWatch = allProgress.stream().mapToInt(VideoChapterProgress::getWatchDuration).sum();
        long completedCount = allProgress.stream().filter(p -> Boolean.TRUE.equals(p.getCompleted())).count();

        // 查询该录播课总章节数来计算整体进度
        Video video = videoRepository.findById(videoId).orElse(null);
        int totalEpisodes = video != null ? video.getTotalEpisodes() : 0;
        int overallProgress = totalEpisodes > 0
                ? (int) (completedCount * 100 / totalEpisodes)
                : 0;

        // 首次学习时 studentCount++
        boolean isFirstTime = !videoStudentRepository.existsByVideoIdAndUserId(videoId, userId);

        VideoStudent student = videoStudentRepository.findByVideoIdAndUserId(videoId, userId)
                .orElseGet(() -> {
                    VideoStudent s = new VideoStudent();
                    s.setVideoId(videoId);
                    s.setUserId(userId);
                    s.setEnrollmentId(0);
                    s.setStartedAt(now);
                    return s;
                });

        student.setLastChapterId(chapterId);
        student.setProgress(Math.min(100, overallProgress));
        student.setCompletedChapters((int) completedCount);
        student.setTotalWatchTime(totalWatch);
        student.setLastWatchedAt(now);

        if (overallProgress >= 100 && student.getIsCompleted() == 0) {
            student.setIsCompleted(1);
            student.setCompletedAt(now);
        }

        videoStudentRepository.save(student);

        // 首次学习：更新 video.studentCount
        if (isFirstTime && video != null) {
            video.setStudentCount(video.getStudentCount() + 1);
            videoRepository.save(video);
        }
    }
}
