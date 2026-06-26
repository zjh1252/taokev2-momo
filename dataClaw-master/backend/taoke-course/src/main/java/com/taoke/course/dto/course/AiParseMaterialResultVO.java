package com.taoke.course.dto.course;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 「AI 解析课程资料」接口返回结果。
 *
 * <p>结构包含三部分：</p>
 * <ul>
 *   <li>{@link #materialUrl} — 上传后文件的可访问 URL（持久化到 courses.material_url）</li>
 *   <li>{@link #materialText} — 抽取后的全文（前端缓存，提交表单时回传后端，存到 courses.material_text）</li>
 *   <li>{@link #parsed} — AI 提取的结构化字段，前端用于回填表单</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-29 20:00
 */
@Data
public class AiParseMaterialResultVO {

    /** 文件 URL */
    private String materialUrl;

    /** 抽取出的全文内容 */
    private String materialText;

    /** AI 解析得到的结构化字段 */
    private ParsedFields parsed;

    /**
     * AI 提取后的可回填字段集合。
     *
     * <p>未能识别的字段统一返回 null / 空字符串 / 空数组，由前端决定是否覆盖表单。</p>
     *
     * <p>注意：课程简介（summary）与课程大纲（syllabus）不在 AI 提取范围内，
     * 由用户自行撰写。</p>
     */
    @Data
    public static class ParsedFields {
        /** 课程标题 */
        private String title;
        /** 课程天数 */
        private Integer durationDays;
        /** 课程总时长（小时） */
        private BigDecimal totalHours;
        /** 一级分类 ID（后端用 categoryName 匹配 COURSE_CATEGORY 后填充；匹配不上为 null） */
        private Integer categoryId;
        /** 一级分类名（AI 原始返回，用于排查） */
        private String categoryName;
        /** 关键词，最多 3 个 */
        private List<String> keywords;
        /** 目标受众 */
        private String audience;
    }
}
