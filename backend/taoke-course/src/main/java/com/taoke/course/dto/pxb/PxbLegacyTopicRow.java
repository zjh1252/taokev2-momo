package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 培训宝 getCourseTopic 单行（对齐 tk_video_topic_item + topic_name）。
 */
@Data
@Builder
public class PxbLegacyTopicRow {

    private Integer id;
    private Integer topicId;
    private String itemName;
    private Integer itemIndex;
    private Integer itemParent;
    private Integer type;
    private Integer serialIndex;
    private Integer price;
    private BigDecimal companyPrice;
    private Integer disabled;
    private String topicName;
    private String packageCode;
    private String descr;
    private String cover;
    private Long createtime;
    private Long updatetime;
    /** 购买状态：0 未购 / 1 已购 / -1 过期 */
    private Integer buyStatus;
}
