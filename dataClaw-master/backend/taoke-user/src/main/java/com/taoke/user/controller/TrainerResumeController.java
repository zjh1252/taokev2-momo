package com.taoke.user.controller;

import com.taoke.common.dto.FileUploadResponse;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.service.FileUploadService;
import com.taoke.common.service.resumeparse.ResumeParseResult;
import com.taoke.common.service.resumeparse.ResumeSectionParser;
import com.taoke.common.service.resumeparse.ResumeTextExtractor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;

/**
 * 专家简历上传与 AI 解析控制器。
 *
 * <p>登录即可访问（无 RequireRole），用于专家「申请角色」流程中：
 * <ol>
 *   <li>{@link #parseAndUpload} — 一次性上传文件到对象存储 + 抽取文本 + 返回结构化解析结果；</li>
 *   <li>{@link #parse} — 仅按 fileUrl 重新解析（用户编辑后想再来一次）。</li>
 * </ol>
 *
 * <p>解析采用「规则化 + 关键词章节切换」算法，端口自老站 PHP {@code parseModule10}。
 * 「擅长行业 / 擅长领域」未接入 LLM，留给前端用户手动多选。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:00
 */
@Tag(name = "专家简历解析")
@Slf4j
@RestController
@RequiredArgsConstructor
public class TrainerResumeController {

    private static final long MAX_RESUME_SIZE_BYTES = 20L * 1024 * 1024; // 20MB

    private final FileUploadService fileUploadService;
    private final ResumeTextExtractor textExtractor;
    private final ResumeSectionParser sectionParser;

    @Operation(summary = "上传简历并解析（multipart/form-data，仅 docx / pdf）")
    @PostMapping(value = "/trainers/me/resume/parse-and-upload", consumes = "multipart/form-data")
    public ApiResponse<ResumeParseAndUploadResponse> parseAndUpload(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请选择简历文件");
        }
        if (file.getSize() > MAX_RESUME_SIZE_BYTES) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE, "简历文件不得超过 20MB");
        }
        String filename = file.getOriginalFilename();

        // 1) 持久化到对象存储，得到 URL（同时也走一遍格式校验）
        FileUploadResponse uploadResp = fileUploadService.uploadFile(file);

        // 2) 抽取文本（直接从 MultipartFile 读流，避免再次下载）
        String text;
        try (InputStream input = file.getInputStream()) {
            text = textExtractor.extract(filename, input);
        } catch (IOException e) {
            log.warn("简历文本抽取失败 file={}", filename, e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "简历解析失败：" + e.getMessage());
        }

        // 3) 章节解析
        ResumeParseResult parsed = sectionParser.parse(text);
        parsed.setResumeUrl(uploadResp.getUrl());

        ResumeParseAndUploadResponse resp = new ResumeParseAndUploadResponse();
        resp.setFileUrl(uploadResp.getUrl());
        resp.setParseResult(parsed);
        return ApiResponse.ok(resp);
    }

    @Operation(summary = "按 fileUrl 重新解析简历（不重新上传）")
    @PostMapping("/trainers/me/resume/parse")
    public ApiResponse<ResumeParseResult> parse(@RequestBody ParseByUrlRequest request) {
        if (request == null || request.getFileUrl() == null || request.getFileUrl().isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "fileUrl 不能为空");
        }
        String url = request.getFileUrl();
        String filename = guessFileName(url);

        try {
            URLConnection conn = URI.create(url).toURL().openConnection();
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(15000);
            try (InputStream in = new BufferedInputStream(conn.getInputStream())) {
                String text = textExtractor.extract(filename, in);
                ResumeParseResult parsed = sectionParser.parse(text);
                parsed.setResumeUrl(url);
                return ApiResponse.ok(parsed);
            }
        } catch (IOException e) {
            log.warn("按 fileUrl 解析失败 url={}", url, e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "无法读取简历文件：" + e.getMessage());
        }
    }

    /** 去除 query 参数后取最后一段作为文件名，用于扩展名分发 */
    private String guessFileName(String url) {
        int q = url.indexOf('?');
        String pure = q >= 0 ? url.substring(0, q) : url;
        int slash = pure.lastIndexOf('/');
        return slash >= 0 ? pure.substring(slash + 1) : pure;
    }

    @Data
    public static class ParseByUrlRequest {
        private String fileUrl;
    }

    @Data
    public static class ResumeParseAndUploadResponse {
        /** 已落库的简历文件可访问 URL */
        private String fileUrl;
        /** 解析结果 */
        private ResumeParseResult parseResult;
    }
}
