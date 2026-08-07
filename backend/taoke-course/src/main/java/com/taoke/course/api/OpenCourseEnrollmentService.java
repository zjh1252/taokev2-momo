package com.taoke.course.api;

import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.enrollment.OpenCourseEnrollmentVO;
import com.taoke.course.dto.enrollment.SubmitOpenCourseEnrollmentRequest;
import com.taoke.course.dto.enrollment.UpdateOpenCourseEnrollmentRequest;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 公开课报名线索 — 跨模块 API
 *
 * @author Fangxinxin
 * @date 2026-08-06 20:15
 */
public interface OpenCourseEnrollmentService {

    /**
     * C 端提交报名（登录可选）
     *
     * @param userId 当前用户，可空
     * @return 新建记录 ID
     */
    Integer submit(Integer userId, SubmitOpenCourseEnrollmentRequest request);

    PageResponse<OpenCourseEnrollmentVO> adminSearch(
            LocalDateTime createdFrom,
            LocalDateTime createdTo,
            String keyword,
            Integer status,
            int page,
            int size);

    OpenCourseEnrollmentVO adminGetDetail(Integer id);

    void adminUpdate(Integer id, UpdateOpenCourseEnrollmentRequest request);

    /**
     * 导出数据：ids 非空则按 ID 导出；否则按当前筛选条件导出（上限保护）
     */
    List<OpenCourseEnrollmentVO> adminListForExport(
            List<Integer> ids,
            LocalDateTime createdFrom,
            LocalDateTime createdTo,
            String keyword,
            Integer status);
}
