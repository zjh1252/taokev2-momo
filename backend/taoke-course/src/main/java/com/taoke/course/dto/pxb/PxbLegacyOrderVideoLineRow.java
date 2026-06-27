package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/** getOrders video_relation[supplier_id].data[video_id] 单行 */
@Data
@Builder
public class PxbLegacyOrderVideoLineRow {

    private Integer videoId;
    private String videoTitle;
    private String videoSubtitle;
    private Integer buyway;
    private Integer fullcut;
    private Integer supplierId;
    private BigDecimal videoPrice;
}
