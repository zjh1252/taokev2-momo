package com.taoke.course.service;

import com.taoke.common.response.PageResponse;
import com.taoke.common.service.RegionService;
import com.taoke.course.dto.learning.ContinueLearningVO;
import com.taoke.course.dto.learning.MyCourseEnrollmentVO;
import com.taoke.course.dto.learning.MyVideoLearningVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.CoursePlan;
import com.taoke.course.entity.order.CourseEnrollment;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoChapter;
import com.taoke.course.entity.video.VideoEnrollment;
import com.taoke.course.entity.video.VideoStudent;
import com.taoke.course.repository.CoursePlanRepository;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.order.CourseEnrollmentRepository;
import com.taoke.course.repository.video.VideoChapterRepository;
import com.taoke.course.repository.video.VideoEnrollmentRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.course.repository.video.VideoStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 我的学习聚合服务 — 负责"我的录播课"、"我的公开课"、"继续学习"三个查询
 * <p>
 * 采用三段式查询模式：分页查主表 ID → 批量回表关联数据 → 组装 VO，
 * 避免 N+1 和分页膨胀问题。
 *
 * @author Fangxinxin
 * @date 2026-04-09 11:00
 */
@Service
@RequiredArgsConstructor
public class LearningService {

    private final VideoStudentRepository videoStudentRepository;
    private final VideoRepository videoRepository;
    private final VideoEnrollmentRepository videoEnrollmentRepository;
    private final VideoChapterRepository videoChapterRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final CourseRepository courseRepository;
    private final CoursePlanRepository coursePlanRepository;
    private final RegionService regionService;

    /**
     * 我的录播课列表（含学习进度）
     *
     * @param userId 当前用户 ID
     * @param page   页码（从 1 开始）
     * @param size   每页条数
     */
    public PageResponse<MyVideoLearningVO> getMyVideos(Integer userId, int page, int size) {
        Page<VideoStudent> studentPage = videoStudentRepository
                .findByUserIdOrderByLastWatchedAtDesc(userId, PageRequest.of(page - 1, size));

        if (studentPage.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), 0, page, size);
        }

        List<VideoStudent> students = studentPage.getContent();
        List<Integer> videoIds = students.stream().map(VideoStudent::getVideoId).toList();

        // 批量查录播课主表
        Map<Integer, Video> videoMap = videoRepository.findAllById(videoIds).stream()
                .collect(Collectors.toMap(Video::getId, Function.identity()));

        // 批量查报名记录（拿 pricePaid / enrolledAt / expiredAt）
        Map<Integer, VideoEnrollment> enrollmentMap = videoEnrollmentRepository
                .findByUserIdAndVideoIdIn(userId, videoIds).stream()
                .collect(Collectors.toMap(VideoEnrollment::getVideoId, Function.identity(), (a, b) -> a));

        List<MyVideoLearningVO> voList = students.stream().map(s -> {
            MyVideoLearningVO vo = new MyVideoLearningVO();
            vo.setVideoId(s.getVideoId());
            vo.setProgress(s.getProgress());
            vo.setCompletedChapters(s.getCompletedChapters());
            vo.setCompleted(s.getIsCompleted() == 1);
            vo.setLastChapterId(s.getLastChapterId());
            vo.setLastWatchedAt(s.getLastWatchedAt());

            Video video = videoMap.get(s.getVideoId());
            if (video != null) {
                vo.setTitle(video.getTitle());
                vo.setCoverUrl(video.getCoverUrl());
                vo.setTeacherName(video.getTeacherName());
                vo.setTotalEpisodes(video.getTotalEpisodes());
            }

            VideoEnrollment enrollment = enrollmentMap.get(s.getVideoId());
            if (enrollment != null) {
                vo.setPricePaid(enrollment.getPricePaid());
                vo.setEnrolledAt(enrollment.getEnrolledAt());
                vo.setExpiredAt(enrollment.getExpiredAt());
            }
            return vo;
        }).toList();

        return PageResponse.of(voList, studentPage.getTotalElements(), page, size);
    }

    /**
     * 我的公开课报名列表
     *
     * @param userId 当前用户 ID
     * @param page   页码（从 1 开始）
     * @param size   每页条数
     */
    public PageResponse<MyCourseEnrollmentVO> getMyCourses(Integer userId, int page, int size) {
        Page<CourseEnrollment> enrollmentPage = courseEnrollmentRepository
                .findByUserIdAndStatusOrderByEnrolledAtDesc(userId, 1, PageRequest.of(page - 1, size));

        if (enrollmentPage.isEmpty()) {
            return PageResponse.of(Collections.emptyList(), 0, page, size);
        }

        List<CourseEnrollment> enrollments = enrollmentPage.getContent();
        List<Integer> courseIds = enrollments.stream().map(CourseEnrollment::getCourseId).toList();

        // 批量查课程主表
        Map<Integer, Course> courseMap = courseRepository.findAllById(courseIds).stream()
                .collect(Collectors.toMap(Course::getId, Function.identity()));

        // 批量查最近一期开课计划（每个课程取 startTime 最晚的一条）
        List<CoursePlan> allPlans = coursePlanRepository.findByCourseIdInOrderBySortOrder(courseIds);
        Map<Integer, CoursePlan> latestPlanMap = new HashMap<>();
        for (CoursePlan plan : allPlans) {
            latestPlanMap.merge(plan.getCourseId(), plan, (existing, incoming) ->
                    incoming.getStartTime().isAfter(existing.getStartTime()) ? incoming : existing);
        }

        // 批量反查城市名
        Set<Integer> cityIds = latestPlanMap.values().stream()
                .map(CoursePlan::getCityId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toSet());
        Map<Integer, String> cityNameMap = regionService.getNamesByIds(cityIds);

        List<MyCourseEnrollmentVO> voList = enrollments.stream().map(e -> {
            MyCourseEnrollmentVO vo = new MyCourseEnrollmentVO();
            vo.setCourseId(e.getCourseId());
            vo.setPricePaid(e.getPricePaid());
            vo.setEnrolledAt(e.getEnrolledAt());
            vo.setExpiredAt(e.getExpiredAt());
            vo.setStatus(e.getStatus());

            Course course = courseMap.get(e.getCourseId());
            if (course != null) {
                vo.setTitle(course.getTitle());
                vo.setCoverUrl(course.getCoverUrl());
                vo.setType(course.getType().name());
                vo.setTypeLabel(course.getType().getLabel());
                vo.setTrainerName(null); // 讲师名需关联查询，暂用 null（后续可补全）
            }

            CoursePlan plan = latestPlanMap.get(e.getCourseId());
            if (plan != null) {
                vo.setPlanStartTime(plan.getStartTime());
                vo.setPlanEndTime(plan.getEndTime());
                vo.setPlanAddress(plan.getAddress());
                vo.setPlanCity(cityNameMap.getOrDefault(plan.getCityId(), ""));
            }
            return vo;
        }).toList();

        return PageResponse.of(voList, enrollmentPage.getTotalElements(), page, size);
    }

    /**
     * 获取最近一个未完成的录播课（用于 Dashboard "继续学习"卡片）
     *
     * @param userId 当前用户 ID
     * @return 未完成的最近录播课，无则返回 null
     */
    public ContinueLearningVO getContinueLearning(Integer userId) {
        Optional<VideoStudent> optStudent = videoStudentRepository
                .findFirstByUserIdAndIsCompletedOrderByLastWatchedAtDesc(userId, 0);

        if (optStudent.isEmpty()) {
            return null;
        }

        VideoStudent student = optStudent.get();
        ContinueLearningVO vo = new ContinueLearningVO();
        vo.setVideoId(student.getVideoId());
        vo.setProgress(student.getProgress());
        vo.setCompletedChapters(student.getCompletedChapters());
        vo.setCompleted(false);
        vo.setLastChapterId(student.getLastChapterId());
        vo.setLastWatchedAt(student.getLastWatchedAt());

        // 查录播课主表
        videoRepository.findById(student.getVideoId()).ifPresent(video -> {
            vo.setTitle(video.getTitle());
            vo.setCoverUrl(video.getCoverUrl());
            vo.setTeacherName(video.getTeacherName());
            vo.setTotalEpisodes(video.getTotalEpisodes());
        });

        // 查报名信息
        videoEnrollmentRepository.findByVideoIdAndUserId(student.getVideoId(), userId)
                .ifPresent(enrollment -> {
                    vo.setPricePaid(enrollment.getPricePaid());
                    vo.setEnrolledAt(enrollment.getEnrolledAt());
                    vo.setExpiredAt(enrollment.getExpiredAt());
                });

        // 查上次学到的章节标题
        if (student.getLastChapterId() != null && student.getLastChapterId() > 0) {
            videoChapterRepository.findById(student.getLastChapterId())
                    .ifPresent(chapter -> vo.setLastChapterTitle(chapter.getTitle()));
        }

        return vo;
    }
}
