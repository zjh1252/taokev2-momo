package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** getOrders orders_list 单行（对齐 tk_video_order + 扩展字段） */
@Data
@Builder
public class PxbLegacyOrderRow {

    private Integer id;
    private String orderSubject;
    private String orderCode;
    private Integer uid;
    private Integer videoNum;
    private Integer paymode;
    private BigDecimal total;
    private Integer useTaobi;
    private Integer status;
    private Integer buyway;
    private Integer concurrency;
    private String discount;
    private BigDecimal originalPrice;
    private Integer pxbSync;
    private Integer disable;
    private Long createtime;
    private Long updatetime;
    private Long starttime;
    private Long endtime;
    private Integer pxbType;
    private String remarks;
    private String pxbKefu;
    private String pxbRemarks;
    private Integer isCostco;
    private Integer cosPrice;
    private Integer rootCompanyId;
    private Integer isCompany;
    private String appId;
    private Integer targetType;
    private Integer expiredStatus;
    private Integer pxbRootId;
    private String username;
    private String realname;
    private Integer cdbid;
    private Integer isIncludePaper;
    private List<Integer> videoIdList;
    @Builder.Default
    private Map<Integer, PxbLegacyOrderSupplierRow> videoRelation = new LinkedHashMap<>();
}
