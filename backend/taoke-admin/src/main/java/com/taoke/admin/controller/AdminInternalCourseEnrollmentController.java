package com.taoke.admin.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.api.InternalCourseEnrollmentService;
import com.taoke.course.dto.enrollment.InternalCourseEnrollmentVO;
import com.taoke.course.dto.enrollment.UpdateInternalCourseEnrollmentRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

/**
 * 后台 — 内训课报名管理
 *
 * @author Fangxinxin
 * @date 2026-08-07 10:15
 */
@Tag(name = "后台-内训课报名")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminInternalCourseEnrollmentController {

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final InternalCourseEnrollmentService enrollmentService;

    @Operation(summary = "分页查询内训课报名")
    @GetMapping("/admin/internal-course-enrollments")
    public ApiResponse<PageResponse<InternalCourseEnrollmentVO>> list(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime createdFrom,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime createdTo,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(enrollmentService.adminSearch(
                createdFrom, createdTo, keyword, status, page, size));
    }

    @Operation(summary = "报名详情")
    @GetMapping("/admin/internal-course-enrollments/{id:\\d+}")
    public ApiResponse<InternalCourseEnrollmentVO> detail(@PathVariable Integer id) {
        return ApiResponse.ok(enrollmentService.adminGetDetail(id));
    }

    @Operation(summary = "更新处理状态与运营备注")
    @PutMapping("/admin/internal-course-enrollments/{id:\\d+}")
    public ApiResponse<Void> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateInternalCourseEnrollmentRequest request) {
        enrollmentService.adminUpdate(id, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "导出 Excel（选中 ids 或按筛选导出）")
    @GetMapping("/admin/internal-course-enrollments/export")
    public void export(
            @RequestParam(required = false) String ids,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime createdFrom,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime createdTo,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            HttpServletResponse response) throws IOException {
        List<Integer> idList = null;
        if (StringUtils.hasText(ids)) {
            idList = Arrays.stream(ids.split(","))
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .map(Integer::valueOf)
                    .toList();
        }
        List<InternalCourseEnrollmentVO> rows = enrollmentService.adminListForExport(
                idList, createdFrom, createdTo, keyword, status);

        String filename = URLEncoder.encode("内训课报名.xlsx", StandardCharsets.UTF_8).replace("+", "%20");
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + filename);

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("内训课报名");
            Row header = sheet.createRow(0);
            String[] cols = {
                    "ID", "提交时间", "真实姓名", "公司名称", "电子邮件", "公司电话", "手机号码",
                    "关联内训课课程", "处理状态", "运营备注"
            };
            for (int i = 0; i < cols.length; i++) {
                header.createCell(i).setCellValue(cols[i]);
            }
            int r = 1;
            for (InternalCourseEnrollmentVO vo : rows) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(vo.getId() != null ? vo.getId() : 0);
                row.createCell(1).setCellValue(formatDt(vo.getCreatedAt()));
                row.createCell(2).setCellValue(nullToEmpty(vo.getRealName()));
                row.createCell(3).setCellValue(nullToEmpty(vo.getCompanyName()));
                row.createCell(4).setCellValue(nullToEmpty(vo.getEmail()));
                row.createCell(5).setCellValue(nullToEmpty(vo.getCompanyPhone()));
                row.createCell(6).setCellValue(nullToEmpty(vo.getMobile()));
                row.createCell(7).setCellValue(nullToEmpty(vo.getCourseTitle()));
                row.createCell(8).setCellValue(nullToEmpty(vo.getStatusLabel()));
                row.createCell(9).setCellValue(nullToEmpty(vo.getAdminRemark()));
            }
            workbook.write(response.getOutputStream());
        }
    }

    private static String formatDt(LocalDateTime dt) {
        return dt == null ? "" : DT.format(dt);
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
