package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.course.api.CourseAiService;
import com.taoke.course.dto.course.AiParseMaterialResultVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 课程模块 AI 能力控制器。
 *
 * <p>当前提供「上传课程资料 → AI 解析回填」的单接口，登录即可访问。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-29 20:00
 */
@Tag(name = "课程-AI", description = "课程模块 AI 辅助能力")
@RestController
@RequiredArgsConstructor
public class CourseAiController {

    private final CourseAiService courseAiService;

    @Operation(summary = "AI 解析课程资料",
            description = "上传课程相关的 docx / pdf / 图片文件；普通文档先抽取文本，扫描 PDF 和图片走视觉模型识别并提取课程字段。")
    @PostMapping(value = "/courses/ai/parse-material", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AiParseMaterialResultVO> parseMaterial(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(courseAiService.parseMaterial(file));
    }
}
