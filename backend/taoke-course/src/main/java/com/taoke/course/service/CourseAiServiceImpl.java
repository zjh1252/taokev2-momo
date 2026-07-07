package com.taoke.course.service;

import com.taoke.common.dto.CategoryTreeVO;
import com.taoke.common.dto.FileUploadResponse;
import com.taoke.common.enums.CategoryType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.FileUploadService;
import com.taoke.common.service.docparse.AliyunOcrTextExtractor;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 课程 AI 解析服务实现。
 *
 * <p>编排步骤：</p>
 * <ol>
 *   <li>调用 {@link FileUploadService#uploadFile(MultipartFile)} 落盘并拿 URL</li>
 *   <li>用 {@link DocumentTextExtractor} 抽取 docx / 文本 PDF 全文</li>
 *   <li>图片或扫描 PDF 走 {@link AliyunOcrTextExtractor} 识别全文</li>
 *   <li>本地规则提取标题、时长、分类、关键词、受众、简介、大纲等字段</li>
 *   <li>对 categoryName 做大小写不敏感、去空格的精确匹配，找到则填 categoryId</li>
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
    private final AliyunOcrTextExtractor aliyunOcrTextExtractor;
    private final CategoryService categoryService;

    private static final Pattern DURATION_DAY_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(天|日)");
    private static final Pattern TOTAL_HOUR_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(小时|课时|学时|h|H)");
    private static final Pattern TITLE_LABEL_PATTERN = Pattern.compile(
            "(?:课程名称|课程标题|培训主题|主题)\\s*[:：]\\s*(.+)");

    @Override
    public AiParseMaterialResultVO parseMaterial(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "请上传课程资料文件");
        }

        // 1. 上传文件
        FileUploadResponse uploaded = uploadMaterial(file);

        String fileName = file.getOriginalFilename();
        String materialText;
        if (isImageFile(fileName, file.getContentType())) {
            materialText = extractOcrText(file);
        } else {
            materialText = extractText(file);
        }
        if ((materialText == null || materialText.isBlank()) && isPdfFile(fileName, file.getContentType())) {
            materialText = extractOcrText(file);
        }
        if (materialText == null || materialText.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "未能从文件中抽取出文本内容，请确认文件不为空");
        }

        // 2. 本地规则解析字段，避免依赖大模型
        AiRawResponse raw = parseFieldsByRules(materialText);

        // 3. 装配结果
        AiParseMaterialResultVO result = buildResult(uploaded.getUrl(), materialText, raw);
        return result;
    }

    private String extractOcrText(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return aliyunOcrTextExtractor.extract(file.getOriginalFilename(), file.getContentType(), in);
        } catch (IOException e) {
            log.warn("课程资料 OCR 读流失败 file={}", file.getOriginalFilename(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "文件读取失败");
        }
    }

    private AiParseMaterialResultVO buildResult(String materialUrl, String materialText, AiRawResponse raw) {
        AiParseMaterialResultVO.ParsedFields parsed = new AiParseMaterialResultVO.ParsedFields();
        parsed.setTitle(blankToNull(raw.getTitle()));
        parsed.setDurationDays(raw.getDurationDays());
        parsed.setTotalHours(raw.getTotalHours());
        parsed.setAudience(blankToNull(raw.getAudience()));
        parsed.setHighlights(blankToNull(raw.getHighlights()));
        parsed.setIntro(blankToNull(raw.getIntro()));
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
        result.setMaterialUrl(materialUrl);
        result.setMaterialText(materialText);
        result.setParsed(parsed);
        return result;
    }

    private FileUploadResponse uploadMaterial(MultipartFile file) {
        if (isImageFile(file.getOriginalFilename(), file.getContentType())) {
            return fileUploadService.uploadImage(file);
        }
        return fileUploadService.uploadFile(file);
    }

    private String extractText(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return documentTextExtractor.extract(file.getOriginalFilename(), in);
        } catch (BusinessException e) {
            if (isPdfFile(file.getOriginalFilename(), file.getContentType())) {
                log.info("PDF 文本层抽取失败，尝试视觉识别 file={}, reason={}", file.getOriginalFilename(), e.getMessage());
                return "";
            }
            throw e;
        } catch (IOException e) {
            log.warn("课程资料文本抽取读流失败 file={}", file.getOriginalFilename(), e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "文档读取失败");
        }
    }

    private static boolean isPdfFile(String fileName, String contentType) {
        String lowerName = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
        String lowerType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        return lowerName.endsWith(".pdf") || "application/pdf".equals(lowerType);
    }

    private static boolean isImageFile(String fileName, String contentType) {
        String lowerName = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
        String lowerType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        return lowerType.startsWith("image/")
                || lowerName.endsWith(".jpg")
                || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png")
                || lowerName.endsWith(".webp");
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

    private AiRawResponse parseFieldsByRules(String materialText) {
        String text = materialText == null ? "" : materialText;
        AiRawResponse raw = new AiRawResponse();
        raw.setMaterialText(text);

        String title = parseTitle(text);
        raw.setTitle(title);

        Integer days = parseDurationDays(text);
        BigDecimal hours = parseTotalHours(text);
        if (hours == null && days != null) {
            hours = BigDecimal.valueOf(days * 6L);
        } else if (days == null && hours != null && hours.compareTo(BigDecimal.ZERO) > 0) {
            days = Math.max(1, hours.divide(BigDecimal.valueOf(6), 0, java.math.RoundingMode.CEILING).intValue());
        }
        raw.setDurationDays(days);
        raw.setTotalHours(hours);

        String categoryName = parseCategoryName(text);
        raw.setCategoryName(categoryName);
        raw.setAudience(extractSection(text, List.of("目标受众", "适用对象", "适用人群", "培训对象", "目标学员", "适合人群"), 300));
        raw.setHighlights(extractSection(text, List.of("课程收益", "培训收益", "学习收益", "课程亮点", "课程目标", "培训目标", "课程价值"), 500));
        raw.setIntro(extractSection(text, List.of("课程简介", "课程介绍", "课程背景", "项目背景", "课程概述"), 800));
        raw.setSyllabus(extractSection(text, List.of("课程大纲", "课程内容", "课程安排", "课程模块", "课程目录", "培训内容"), 1500));
        if (raw.getIntro() == null) {
            raw.setIntro(firstTextBlock(text, 500));
        }
        raw.setKeywords(parseKeywords(text, title, categoryName));
        return raw;
    }

    private String parseTitle(String text) {
        Matcher labelMatcher = TITLE_LABEL_PATTERN.matcher(text);
        if (labelMatcher.find()) {
            return cleanLine(labelMatcher.group(1), 80);
        }
        for (String line : splitLines(text)) {
            String cleaned = cleanLine(line, 80);
            if (cleaned == null) {
                continue;
            }
            if (cleaned.matches("第\\s*\\d+\\s*页") || cleaned.length() < 4) {
                continue;
            }
            if (cleaned.contains("目录") || cleaned.contains("课程大纲") || cleaned.contains("课程内容")) {
                continue;
            }
            return cleaned;
        }
        return null;
    }

    private Integer parseDurationDays(String text) {
        Matcher matcher = DURATION_DAY_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        BigDecimal value = new BigDecimal(matcher.group(1));
        return Math.max(1, value.setScale(0, java.math.RoundingMode.CEILING).intValue());
    }

    private BigDecimal parseTotalHours(String text) {
        Matcher matcher = TOTAL_HOUR_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return new BigDecimal(matcher.group(1)).stripTrailingZeros();
    }

    private String parseCategoryName(String text) {
        String normalized = text == null ? "" : text.toLowerCase(Locale.ROOT);
        for (String name : listCourseCategoryNames()) {
            if (name != null && !name.isBlank() && normalized.contains(name.toLowerCase(Locale.ROOT))) {
                return name;
            }
        }
        return null;
    }

    private List<String> parseKeywords(String text, String title, String categoryName) {
        List<String> keywords = new ArrayList<>();
        String explicit = extractSection(text, List.of("关键词", "关键字", "标签"), 80);
        if (explicit != null) {
            for (String part : explicit.split("[,，、;；\\s]+")) {
                addKeyword(keywords, part);
            }
        }
        addKeyword(keywords, categoryName);
        if (title != null) {
            for (String part : title.split("[《》:：,，、;；\\s]+")) {
                if (part.length() >= 2 && part.length() <= 8) {
                    addKeyword(keywords, part);
                }
            }
        }
        return keywords.isEmpty() ? null : keywords.stream().limit(3).collect(Collectors.toList());
    }

    private static void addKeyword(List<String> keywords, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return;
        }
        String cleaned = keyword.trim();
        if (!keywords.contains(cleaned)) {
            keywords.add(cleaned);
        }
    }

    private String extractSection(String text, List<String> labels, int maxChars) {
        List<String> lines = splitLines(text);
        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i).trim();
            String matchedLabel = labels.stream().filter(line::contains).findFirst().orElse(null);
            if (matchedLabel == null) {
                continue;
            }
            StringBuilder section = new StringBuilder();
            String sameLine = line.substring(line.indexOf(matchedLabel) + matchedLabel.length())
                    .replaceFirst("^\\s*[:：-]*\\s*", "");
            appendSectionLine(section, sameLine, maxChars);
            for (int j = i + 1; j < lines.size() && section.length() < maxChars; j++) {
                String next = lines.get(j).trim();
                if (next.isBlank() || isSectionBoundary(next)) {
                    if (section.length() > 0) {
                        break;
                    }
                    continue;
                }
                appendSectionLine(section, next, maxChars);
            }
            String value = section.toString().trim();
            return value.isBlank() ? null : value;
        }
        return null;
    }

    private static void appendSectionLine(StringBuilder section, String line, int maxChars) {
        String cleaned = cleanLine(line, maxChars);
        if (cleaned == null || section.length() >= maxChars) {
            return;
        }
        if (section.length() > 0) {
            section.append('\n');
        }
        int remaining = maxChars - section.length();
        section.append(cleaned, 0, Math.min(cleaned.length(), remaining));
    }

    private static boolean isSectionBoundary(String line) {
        String cleaned = line.trim();
        if (cleaned.matches("第\\s*\\d+\\s*页")) {
            return true;
        }
        if (cleaned.length() <= 16 && cleaned.matches(".*(课程简介|课程介绍|课程背景|课程收益|课程亮点|课程目标|目标受众|适用对象|培训对象|课程大纲|课程内容|课程安排|课程模块|目录|讲师介绍).*")) {
            return true;
        }
        return cleaned.length() <= 20 && cleaned.endsWith("：");
    }

    private static String firstTextBlock(String text, int maxChars) {
        StringBuilder block = new StringBuilder();
        for (String line : splitLines(text)) {
            String cleaned = cleanLine(line, maxChars);
            if (cleaned == null || cleaned.matches("第\\s*\\d+\\s*页")) {
                continue;
            }
            appendSectionLine(block, cleaned, maxChars);
            if (block.length() >= maxChars) {
                break;
            }
        }
        String value = block.toString().trim();
        return value.isBlank() ? null : value;
    }

    private static List<String> splitLines(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        return text.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .collect(Collectors.toList());
    }

    private static String cleanLine(String line, int maxChars) {
        if (line == null) {
            return null;
        }
        String cleaned = line.trim()
                .replaceFirst("^[\\s#>*•·\\-—–一二三四五六七八九十0-9.、)）(（]+", "")
                .trim();
        if (cleaned.isBlank()) {
            return null;
        }
        return cleaned.length() > maxChars ? cleaned.substring(0, maxChars) : cleaned;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    /** 本地规则解析出的中间字段，结构沿用原 AI 返回字段名。 */
    @Data
    public static class AiRawResponse {
        private String materialText;
        private String title;
        private Integer durationDays;
        private BigDecimal totalHours;
        private String categoryName;
        private List<String> keywords;
        private String audience;
        private String highlights;
        private String intro;
        private String syllabus;
    }
}
