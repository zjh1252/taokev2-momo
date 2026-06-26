package com.taoke.common.service.resumeparse;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 简历解析结果 — 端口老站 PHP parseModule10 输出的核心字段。
 *
 * <p>所有字段均为「尽力提取」，命中后填充；不命中保留默认空字符串 / 空列表，
 * 由前端按非空逻辑覆盖到表单中。</p>
 *
 * <p>「擅长行业 / 擅长领域」老站使用百度千帆 LLM 自动归类，本期 Java 版未接入
 * LLM，故 {@code industries} 与 {@code specialties} 始终为空，留给前端用户手动多选。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:00
 */
@Data
public class ResumeParseResult {

    /** 真实姓名（首行 + 中文+(老师|讲师|教授) 等回退规则） */
    private String realName;

    /** 授课姓名（默认与 realName 相同，给前端做初值） */
    private String teachingName;

    /** 一句话介绍（首部第 2 行未命中章节时） */
    private String oneLineIntro;

    /** 身份资质（章节，3 行起未命中前的累积） */
    private String credential;

    /** 部分客户（「部分客户」章节文本） */
    private String partialClients;

    /** 联系电话（11 位中国手机号） */
    private String phone;

    /** 邮箱 */
    private String email;

    /** 个人简介 / 详细介绍（「更多简介」+ 风格特色等的合并） */
    private String bio;

    /** 实战经历 / 从业背景（章节文本） */
    private String background;

    /** 授课风格（章节文本） */
    private String teachingStyle;

    /** 提取到的 URL 列表（讲师视频链接候选） */
    private List<String> videos = new ArrayList<>();

    /** 擅长领域 — 本期未实现自动归类，留空 */
    private List<String> specialties = new ArrayList<>();

    /** 擅长行业 — 本期未实现自动归类，留空 */
    private List<String> industries = new ArrayList<>();

    /** 解析时使用的简历文件 URL（透传给前端） */
    private String resumeUrl;
}
