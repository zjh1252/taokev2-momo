package com.taoke.course.scheduler;

import com.taoke.course.entity.Course;
import com.taoke.course.enums.CourseStatus;
import com.taoke.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 过期公开课自动下架 — 全部开课计划均已结束时将已上架公开课下架。
 *
 * @author Fangxinxin
 * @date 2026-06-11 10:00
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiredOpenCourseScheduler {

    private final CourseRepository courseRepository;

    @Scheduled(cron = "0 5 * * * ?")
    @Transactional
    public void autoUnpublishExpiredOpenCourses() {
        LocalDateTime now = LocalDateTime.now();
        List<Integer> ids = courseRepository.findExpiredPublishedOpenCourseIds(now);
        if (ids.isEmpty()) {
            return;
        }

        List<Course> courses = courseRepository.findAllById(ids);
        int count = 0;
        for (Course course : courses) {
            if (course.getStatus() == CourseStatus.PUBLISHED.getValue()) {
                course.setStatus(CourseStatus.UNPUBLISHED.getValue());
                count++;
            }
        }
        if (count > 0) {
            courseRepository.saveAll(courses);
            log.info("自动下架过期公开课 {} 门", count);
        }
    }
}
