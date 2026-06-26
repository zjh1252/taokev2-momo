package com.taoke.user.dto.trainercase;

import lombok.Data;

/**
 * 近期已审核案例响应 — 用于 C 端专家列表页 / 首页的「滚动案例位」轻量展示。
 *
 * <p>字段说明：</p>
 * <ul>
 *     <li>{@code id} 案例主键，便于前端 key 去重。</li>
 *     <li>{@code trainerId} / {@code trainerUserId} / {@code trainerName} / {@code trainerAvatar}
 *         反查回来的专家信息，方便前端点击直接跳转到 {@code /trainers/{trainerId}?tab=cases}。</li>
 *     <li>{@code coverImage}、{@code caseTitle} 卡片主展示字段。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 14:10
 */
@Data
public class TrainerCaseRecentResponse {

    private Integer id;
    private Integer trainerId;
    private Integer trainerUserId;
    private String trainerName;
    private String trainerAvatar;
    /** 专家综合评分，前端用于行末展示「★ 4.5」 */
    private java.math.BigDecimal trainerScore;
    private String caseTitle;
    private String coverImage;
    private String industry;
    private String description;
    /** 培训日期，首页「专家案例」展示案例时间 */
    private java.time.LocalDate trainingDate;
}
