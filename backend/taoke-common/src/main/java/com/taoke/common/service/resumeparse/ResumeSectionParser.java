package com.taoke.common.service.resumeparse;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 简历章节解析器 — 端口老站 PHP {@code parseModule10} 行为。
 *
 * <p>输入是 {@link ResumeTextExtractor} 抽取出的纯文本（保留换行），
 * 输出 {@link ResumeParseResult}，供前端预填申请表单。</p>
 *
 * <p>核心算法（与 PHP 对齐）：
 * <ol>
 *   <li>按 {@code \r?\n} 切行；</li>
 *   <li>对去空格后长度 ≤ 12 的行尝试匹配章节关键字（一句话介绍 / 身份资质 /
 *       擅长课题 / 风格特色 / 部分客户 / 客户感言 / 典型案例 / 联系方式 /
 *       讲师视频 / 摒弃模块）；命中即切换 currentSection；</li>
 *   <li>未命中前 2 行 → oneLineIntro；3 行起未命中 → credential；</li>
 *   <li>姓名规则：中文+(老师|讲师|教授) → 中文+(博士简介|英文简介|简介|专家|
 *       个人介绍) → 首行 ≤ 9 字 三层回退；</li>
 *   <li>额外正则：手机号 (1[3-9]\d{9}) / 邮箱 / URL（视频候选）。</li>
 * </ol>
 * </p>
 *
 * <p>「擅长行业 / 擅长领域」老站使用 LLM 归类，本期 Java 版未接入，
 * 留给用户在表单中手动多选。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:00
 */
@Service
public class ResumeSectionParser {

    /** 章节关键字字典：value 中任一关键字命中（包含/前缀风格）即切换到该章节 */
    private static final Map<String, List<String>> SECTION_KEYWORDS = buildSectionKeywords();

    /** "摒弃模块" 用于忽略后续段落（与 PHP discard 一致） */
    private static final String SECTION_DISCARD = "摒弃模块";

    /** 中国大陆手机号 */
    private static final Pattern PHONE = Pattern.compile("(?<![0-9])(1[3-9]\\d{9})(?![0-9])");

    /** 邮箱 */
    private static final Pattern EMAIL = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");

    /** URL（视频/链接候选） */
    private static final Pattern URL = Pattern.compile("https?://[\\w./\\-?=&%#]+", Pattern.CASE_INSENSITIVE);

    /** 中文+(老师|讲师|教授) — 命中作为姓名候选 */
    private static final Pattern NAME_TEACHER = Pattern.compile("([\\u4e00-\\u9fa5]{2,6})(老师|讲师|教授)");

    /** 中文+(博士简介|英文简介|简介|专家|个人介绍) — 命中作为姓名候选 */
    private static final Pattern NAME_INTRO = Pattern.compile("([\\u4e00-\\u9fa5]{2,6})(博士简介|英文简介|简介|专家|个人介绍)");

    /** 仅含中文字符的姓名（≤ 9 字） */
    private static final Pattern PURE_CN_NAME = Pattern.compile("^[\\u4e00-\\u9fa5]{2,9}$");

    private static Map<String, List<String>> buildSectionKeywords() {
        Map<String, List<String>> m = new LinkedHashMap<>();
        m.put("一句话介绍", List.of("个性签名", "座右铭", "个人宣言", "自我简介短句", "态度宣言", "风格签名", "心灵寄语", "简短格言", "一句话介绍"));
        m.put("身份资质", List.of("名誉资质", "专业资质", "资格认证", "资历证明", "身份资质", "资质认证"));
        m.put("擅长课题", List.of("主打课程", "擅长领域", "专业领域", "精通课题", "强项课题", "优势课题", "拿手课题", "专长课题", "擅长课题", "主讲课程", "主要课程"));
        m.put("风格特色", List.of("个性特质", "独特风貌", "典型特征", "特色风格", "显著特色", "标志性风格", "独特格调", "风格特色", "授课风格"));
        m.put("部分客户", List.of("目标客户", "选定客户", "服务客户", "服务过的客户", "部分客户", "服务过客户"));
        m.put("客户感言", List.of("客户评价", "客户证言", "客户声音", "客户感言"));
        m.put("典型案例", List.of("典型案例", "代表案例", "成功案例"));
        m.put("联系方式", List.of("联系方式", "联系电话", "手机", "邮箱", "Email"));
        m.put("讲师视频", List.of("讲师视频", "授课视频", "演讲视频"));
        m.put("更多简介", List.of("个人简介", "讲师简介", "更多简介", "详细介绍", "自我介绍"));
        m.put("从业背景", List.of("工作经历", "从业经历", "实战经历", "工作背景", "从业背景"));
        m.put(SECTION_DISCARD, List.of("摒弃模块"));
        return m;
    }

    /**
     * 解析入口。
     *
     * @param rawText 已经抽取出的纯文本（含 \n 换行）
     * @return 解析结果（字段尽力填充）
     */
    public ResumeParseResult parse(String rawText) {
        ResumeParseResult result = new ResumeParseResult();
        if (rawText == null || rawText.isBlank()) return result;

        String normalized = rawText.replace("\r\n", "\n").replace('\r', '\n');
        String[] lines = normalized.split("\n");

        Map<String, StringBuilder> sectionContent = new LinkedHashMap<>();
        StringBuilder oneLineBuf = new StringBuilder();
        StringBuilder credentialBuf = new StringBuilder();
        StringBuilder moreBuf = new StringBuilder();

        String currentSection = null;
        int rowIndex = 0;

        for (String raw : lines) {
            if (raw == null) continue;
            String line = raw.trim();
            if (line.isEmpty()) continue;

            // 累计姓名候选（仅看前两行非空）
            if (rowIndex < 2 && result.getRealName() == null) {
                String name = pickName(line);
                if (name != null) {
                    result.setRealName(name);
                    result.setTeachingName(name);
                }
            }

            // 短行（去空格后 ≤ 12 字）尝试章节切换
            String compact = line.replaceAll("\\s+", "");
            boolean matchedSection = false;
            if (compact.length() <= 12) {
                String section = matchSection(compact);
                if (section != null) {
                    if (SECTION_DISCARD.equals(section)) {
                        currentSection = null;
                    } else {
                        currentSection = section;
                        sectionContent.computeIfAbsent(section, k -> new StringBuilder());
                    }
                    matchedSection = true;
                }
            }

            if (!matchedSection) {
                if (currentSection != null) {
                    sectionContent.get(currentSection).append(line).append('\n');
                } else {
                    if (rowIndex == 1) {
                        // 第 2 行未命中章节 → 一句话介绍
                        oneLineBuf.append(line);
                    } else if (rowIndex >= 2) {
                        // 第 3 行起未命中章节 → 身份资质
                        credentialBuf.append(line).append('\n');
                    }
                }
            }

            rowIndex++;
        }

        // 兜底：首行作为姓名候选
        if (result.getRealName() == null && lines.length > 0) {
            String first = lines[0] == null ? "" : lines[0].trim();
            if (PURE_CN_NAME.matcher(first).matches()) {
                result.setRealName(first);
                result.setTeachingName(first);
            }
        }

        // 章节内容回填
        if (oneLineBuf.length() > 0) {
            result.setOneLineIntro(truncate(oneLineBuf.toString().trim(), 200));
        }
        if (credentialBuf.length() > 0) {
            result.setCredential(credentialBuf.toString().trim());
        }
        result.setPartialClients(getSection(sectionContent, "部分客户"));
        result.setBackground(getSection(sectionContent, "从业背景"));
        result.setTeachingStyle(getSection(sectionContent, "风格特色"));

        // 拼接 bio：一句话介绍 + 身份资质 + 「更多简介」/「典型案例」段落
        StringBuilder bio = new StringBuilder();
        appendIfNotBlank(bio, result.getOneLineIntro());
        appendIfNotBlank(bio, result.getCredential());
        appendIfNotBlank(bio, getSection(sectionContent, "更多简介"));
        appendIfNotBlank(bio, getSection(sectionContent, "典型案例"));
        if (bio.length() > 0) {
            result.setBio(bio.toString().trim());
        } else if (moreBuf.length() > 0) {
            result.setBio(moreBuf.toString().trim());
        }

        // 联系方式：从全文 + 「联系方式」章节中匹配手机号 / 邮箱
        String contactZone = (getSection(sectionContent, "联系方式") + "\n" + normalized);
        Matcher mPhone = PHONE.matcher(contactZone);
        if (mPhone.find()) {
            result.setPhone(mPhone.group(1));
        }
        Matcher mEmail = EMAIL.matcher(contactZone);
        if (mEmail.find()) {
            result.setEmail(mEmail.group());
        }

        // 视频链接：全文 URL
        Matcher mUrl = URL.matcher(normalized);
        while (mUrl.find()) {
            String u = mUrl.group();
            if (!result.getVideos().contains(u)) {
                result.getVideos().add(u);
            }
        }

        return result;
    }

    private String matchSection(String compactLine) {
        for (Map.Entry<String, List<String>> e : SECTION_KEYWORDS.entrySet()) {
            String section = e.getKey();
            for (String kw : e.getValue()) {
                if (compactLine.contains(kw)) {
                    return section;
                }
            }
        }
        return null;
    }

    private String pickName(String line) {
        Matcher m1 = NAME_TEACHER.matcher(line);
        if (m1.find()) return m1.group(1);
        Matcher m2 = NAME_INTRO.matcher(line);
        if (m2.find()) return m2.group(1);
        if (line.length() <= 9 && PURE_CN_NAME.matcher(line).matches()) {
            return line;
        }
        return null;
    }

    private String getSection(Map<String, StringBuilder> map, String key) {
        StringBuilder sb = map.get(key);
        return sb == null ? null : sb.toString().trim();
    }

    private void appendIfNotBlank(StringBuilder sb, String text) {
        if (text == null || text.isBlank()) return;
        if (sb.length() > 0) sb.append("\n\n");
        sb.append(text);
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
