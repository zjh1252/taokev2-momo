package com.taoke.course.dto.cms;

import lombok.Data;

/**
 * 更新推荐位布局配置
 *
 * @author Fangxinxin
 * @date 2026-06-16 14:00
 */
@Data
public class UpdateRecommendationSlotConfigRequest {

    private Boolean lockMain;
    private Boolean lockMiddle;
}
