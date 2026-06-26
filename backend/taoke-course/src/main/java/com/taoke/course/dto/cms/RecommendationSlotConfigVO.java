package com.taoke.course.dto.cms;

import lombok.Data;

/**
 * 推荐位布局配置
 *
 * @author Fangxinxin
 * @date 2026-06-16 14:00
 */
@Data
public class RecommendationSlotConfigVO {

    private String slotCode;
    private Boolean lockMain;
    private Boolean lockMiddle;
}
