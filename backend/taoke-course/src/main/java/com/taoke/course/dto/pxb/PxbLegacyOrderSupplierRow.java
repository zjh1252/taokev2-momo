package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/** getOrders video_relation[supplier_id] */
@Data
@Builder
public class PxbLegacyOrderSupplierRow {

    private Integer supplierId;
    private BigDecimal total;
    private String discount;
    private BigDecimal originalPrice;
    private Integer uid;
    private String username;
    private Integer groupid;
    private String company;
    @Builder.Default
    private Map<Integer, PxbLegacyOrderVideoLineRow> data = new LinkedHashMap<>();
}
