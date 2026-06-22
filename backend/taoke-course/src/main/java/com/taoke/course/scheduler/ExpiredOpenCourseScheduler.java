package com.taoke.course.scheduler;

import com.taoke.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * 过期线下公开课识别 — 每日凌晨记录到期且开启自动隐藏的课程 ID，不修改上下架状态。
 *
 * @author Fangxinxin
 * @date 2026-06-11 10:00
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiredOpenCourseScheduler {

    private final CourseRepository courseRepository;

    @Scheduled(cron = "0 0 0 * * ?")
    public void logExpiredOpenCoursesForHide() {
        LocalDate today = LocalDate.now();
        List<Integer> ids = courseRepository.findExpiredHideCandidateIds(today);
        if (ids.isEmpty()) {
            log.info("过期线下公开课（自动隐藏开启）识别：今日无新增命中");
            return;
        }
        log.info("过期线下公开课（自动隐藏开启）识别：共 {} 门，courseIds={}", ids.size(), ids);
    }
}
