package com.taoke.course.dto.order;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 管理后台录播课订单列表项
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AdminVideoOrderListItemVO extends OrderVO {

    private Integer userId;

    private String userName;

    /** 本订单关联的有效学员数 */
    private Long learnerCount;

    /** 录播课标题摘要（逗号分隔） */
    private String videoTitles;
}
