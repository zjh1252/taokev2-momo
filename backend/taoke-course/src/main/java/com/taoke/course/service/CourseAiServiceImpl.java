package com.taoke.course.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.taoke.common.ai.AiChatService;
import com.taoke.common.config.AiProperties;
import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.dto.FileUploadResponse;
import com.taoke.common.enums.CategoryType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.FileUploadService;
import com.taoke.common.service.docparse.DocumentTextExtractor;
import com.taoke.course.api.CourseAiService;
import com.taoke.course.dto.course.AiParseMaterialResultVO;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * 课程 AI 解析服务实现。
 *
 * <p>编排步骤：</p>
 * <ol>
 *   <li>调用 {@link FileUploadService#uploadFile(MultipartFile)} 落盘并拿 URL</li>
 *   <li>用 {@link DocumentTextExtractor} 抽取 docx / pdf 全文</li>
 *   <li>文本超长按「前段 + 末段」截断，避免触发 LLM token 上限</li>
 *   <li>把 COURSE_CATEGORY 的候选分类一起写进系统提示词，调用 {@link AiChatService#chatJson}</li>
 *   <li>对 AI 返回的 categoryName 做大小写不敏感、去空格的精确匹配，找到则填 categoryId</li>
 *   <li>关键词裁到最多 3 个，全部空字段保持 null</li>
 * </ol>
 *
 * @author Fangxinxin
 * @date 2026-04-29 20:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CourseAiServiceImpl implements CourseAiService {

    private final FileUploadService fileUploadService;
    private final DocumentTextExtractor documentTextExtractor;
    private final AiChatService aiChatService;
    private final CategoryService categoryService;
    private final AiProperties aiProperties;

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            你是一名课程资料结构化分析助手。
            用户会给你一段课程相关的原始资料（讲义/PPT/PDF 转写文本），请你根据资料内容提取出以下字段并以 JSON 输出：

            字段说明：
            - title          (string): 课程标题
            - durationDays   (integer|null): 课程培训天数（整数）；若资料中能推断出整数天数则填，否则为 null
            - totalHours     (number|null): 课程总时长（小时，可含一位小数）；若资料中明确说明总课时则填，否则为 null
            - categoryName   (string|null): 一级课程分类名，必须严格从以下候选中选择最匹配的一项，没有把握就留空：[%s]
            - keywords       (array<string>): 提炼最多 3 个关键词，按重要性排序
            - audience       (string): 目标受众（适用人群）
            - summary        (string): 课程简介，一段话不超过 200 字
            - syllabus       (string): 课程大纲，按模块/章节列出要点，使用换行表达层级，不要使用 markdown 标记

            严格要求：
            1. 输出必须是合法 JSON 对象，键名严格按上面的英文名；
            2. 没有把握 / 资料中无明确信息的字段，按照上述类型返回 null 或空串/空数组，禁止编造；
            3. 不要在 JSON 之外输出任何解释性文字，不要使用 markdown 代码块。
            """;

    @Override
    public AiParseMaterialResultVO parseMaterial(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请上传课程资料文件");
        }

        // 1. 上传文件
        FileUploadResponse uploaded = fileUploadService.uploadFile(file);

        // 2. 抽取文本（以原始文件名识别格式，重新打开 InputStream）
        String materialText;
        try (InputStream in = file.getInputStream()) {
            materialText = documentTextExtractor.extract(file.getOriginalFilename(), in);
        } catch (IOException e) {
            log.warn("课程资料文本抽取读流失败 file={}", file.getOriginalFilename(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "文档读取失败");
        }
        if (materialText == null || materialText.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "未能从文件中抽取出文本内容，请确认文件不为空且非纯图片扫描件");
        }

        // 3. 调用 AI（candidates 注入提示词；输入文本截断）
        List<String> candidates = listCourseCategoryNames();
        String systemPrompt = SYSTEM_PROMPT_TEMPLATE.formatted(String.join(", ", candidates));
        String userPrompt = truncate(materialText, aiProperties.getMaxInputChars());

        AiRawResponse raw = aiChatService.chatJson(systemPrompt, userPrompt, AiRawResponse.class);

        // 4. 装配结果
        AiParseMaterialResultVO.ParsedFields parsed = new AiParseMaterialResultVO.ParsedFields();
        parsed.setTitle(blankToNull(raw.getTitle()));
        parsed.setDurationDays(raw.getDurationDays());
        parsed.setTotalHours(raw.getTotalHours());
        parsed.setAudience(blankToNull(raw.getAudience()));
        parsed.setSummary(blankToNull(raw.getSummary()));
        parsed.setSyllabus(blankToNull(raw.getSyllabus()));

        // 关键词裁切到最多 3 个
        if (raw.getKeywords() != null && !raw.getKeywords().isEmpty()) {
            List<String> kw = raw.getKeywords().stream()
                    .filter(k -> k != null && !k.isBlank())
                    .map(String::trim)
                    .limit(3)
                    .collect(Collectors.toList());
            parsed.setKeywords(kw.isEmpty() ? null : kw);
        }

        // 分类按名字精确匹配 COURSE_CATEGORY
        String aiCategoryName = blankToNull(raw.getCategoryName());
        if (aiCategoryName != null) {
            parsed.setCategoryName(aiCategoryName);
            Integer matchedId = matchCategoryId(aiCategoryName);
            parsed.setCategoryId(matchedId);
        }

        AiParseMaterialResultVO result = new AiParseMaterialResultVO();
        result.setMaterialUrl(uploaded.getUrl());
        result.setMaterialText(materialText);
        result.setParsed(parsed);
        return result;
    }

    /** 取一级 COURSE_CATEGORY 的所有可见分类名 */
    private List<String> listCourseCategoryNames() {
        List<CategoryTreeVO> tree = categoryService.getTree(CategoryType.COURSE_CATEGORY.name());
        List<String> names = new ArrayList<>();
        if (tree != null) {
            for (CategoryTreeVO node : tree) {
                if (node != null && node.getName() != null && !node.getName().isBlank()) {
                    names.add(node.getName());
                }
            }
        }
        return names;
    }

    /** 用大小写不敏感、去空格的方式做精确匹配；匹配不上返回 null */
    private Integer matchCategoryId(String name) {
        String normalized = name.trim().toLowerCase(Locale.ROOT);
        List<CategoryTreeVO> tree = categoryService.getTree(CategoryType.COURSE_CATEGORY.name());
        if (tree == null) {
            return null;
        }
        for (CategoryTreeVO node : tree) {
            if (node == null || node.getName() == null) {
                continue;
            }
            if (normalized.equals(node.getName().trim().toLowerCase(Locale.ROOT))) {
                return node.getId();
            }
        }
        return null;
    }

    /** 文本超出限制时取前 70% + 末 30%，中段截掉，最大化保留首尾上下文 */
    private static String truncate(String text, Integer max) {
        if (max == null || max <= 0 || text == null || text.length() <= max) {
            return text == null ? "" : text;
        }
        int head = (int) (max * 0.7);
        int tail = max - head;
        return text.substring(0, head)
                + "\n\n... (中间内容已截断，原文长度 " + text.length() + " 字) ...\n\n"
                + text.substring(text.length() - tail);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    /** AI 原始返回（仅用于反序列化，键名与提示词一致） */
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AiRawResponse {
        private String title;
        private Integer durationDays;
        private BigDecimal totalHours;
        private String categoryName;
        private List<String> keywords;
        private String audience;
        private String summary;
        private String syllabus;
    }
}
