package com.taoke.legacy.adapter;

import com.taoke.course.dto.pxb.PxbLegacyOrderPage;
import com.taoke.course.dto.pxb.PxbLegacyOrderRow;
import com.taoke.course.dto.pxb.PxbLegacyOrderSupplierRow;
import com.taoke.course.dto.pxb.PxbLegacyOrderVideoLineRow;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class LegacyOrderAdapter {

    public Map<String, Object> toListResponse(PxbLegacyOrderPage page) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", page.getTotal());
        List<Map<String, Object>> ordersList = new ArrayList<>();
        for (PxbLegacyOrderRow row : page.getOrders()) {
            ordersList.add(toOrderMap(row));
        }
        result.put("orders_list", ordersList);
        return result;
    }

    private Map<String, Object> toOrderMap(PxbLegacyOrderRow row) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", row.getId());
        map.put("order_subject", nullToEmpty(row.getOrderSubject()));
        map.put("order_code", row.getOrderCode());
        map.put("uid", row.getUid());
        map.put("video_num", row.getVideoNum() != null ? row.getVideoNum() : 0);
        map.put("paymode", row.getPaymode() != null ? row.getPaymode() : 0);
        map.put("total", formatMoney(row.getTotal()));
        map.put("use_taobi", row.getUseTaobi() != null ? row.getUseTaobi() : 0);
        map.put("status", row.getStatus());
        map.put("buyway", row.getBuyway() != null ? row.getBuyway() : 2);
        map.put("concurrency", row.getConcurrency() != null ? row.getConcurrency() : 1);
        map.put("discount", row.getDiscount() != null ? row.getDiscount() : "1.0");
        map.put("original_price", formatMoney(row.getOriginalPrice()));
        map.put("pxb_sync", row.getPxbSync() != null ? row.getPxbSync() : 0);
        map.put("disable", row.getDisable() != null ? row.getDisable() : 0);
        map.put("createtime", row.getCreatetime() != null ? row.getCreatetime() : 0L);
        map.put("updatetime", row.getUpdatetime() != null ? row.getUpdatetime() : 0L);
        map.put("starttime", row.getStarttime() != null ? row.getStarttime() : 0L);
        map.put("endtime", row.getEndtime() != null ? row.getEndtime() : 0L);
        map.put("pxb_type", row.getPxbType() != null ? row.getPxbType() : 0);
        map.put("remarks", nullToEmpty(row.getRemarks()));
        map.put("pxb_kefu", nullToEmpty(row.getPxbKefu()));
        map.put("pxb_remarks", nullToEmpty(row.getPxbRemarks()));
        map.put("is_costco", row.getIsCostco() != null ? row.getIsCostco() : 0);
        map.put("cos_price", row.getCosPrice() != null ? row.getCosPrice() : 0);
        map.put("root_company_id", row.getRootCompanyId() != null ? row.getRootCompanyId() : 0);
        map.put("is_company", row.getIsCompany() != null ? row.getIsCompany() : 0);
        map.put("app_id", row.getAppId() != null ? row.getAppId() : "");
        map.put("target_type", row.getTargetType() != null ? row.getTargetType() : 0);
        map.put("expired_status", row.getExpiredStatus() != null ? row.getExpiredStatus() : 0);
        map.put("pxb_root_id", row.getPxbRootId() != null ? row.getPxbRootId() : 0);
        map.put("username", nullToEmpty(row.getUsername()));
        map.put("realname", nullToEmpty(row.getRealname()));
        map.put("cdbid", row.getCdbid() != null ? row.getCdbid() : 0);
        map.put("is_include_paper", row.getIsIncludePaper() != null ? row.getIsIncludePaper() : 0);
        map.put("video_id_list", row.getVideoIdList() != null ? row.getVideoIdList() : List.of());
        map.put("video_relation", toVideoRelationMap(row.getVideoRelation()));
        map.put("pay_status", legacyPayStatusLabel(row.getStatus()));
        return map;
    }

    private Map<String, Object> toVideoRelationMap(Map<Integer, PxbLegacyOrderSupplierRow> relation) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (relation == null || relation.isEmpty()) {
            return result;
        }
        for (PxbLegacyOrderSupplierRow supplier : relation.values()) {
            Map<String, Object> supplierMap = new LinkedHashMap<>();
            supplierMap.put("supplier_id", supplier.getSupplierId());
            supplierMap.put("total", formatMoney(supplier.getTotal()));
            supplierMap.put("discount", supplier.getDiscount() != null ? supplier.getDiscount() : "1.0");
            supplierMap.put("original_price", formatMoney(supplier.getOriginalPrice()));
            supplierMap.put("uid", supplier.getUid());
            supplierMap.put("username", nullToEmpty(supplier.getUsername()));
            supplierMap.put("groupid", supplier.getGroupid() != null ? supplier.getGroupid() : 0);
            supplierMap.put("company", nullToEmpty(supplier.getCompany()));
            Map<String, Object> data = new LinkedHashMap<>();
            if (supplier.getData() != null) {
                for (PxbLegacyOrderVideoLineRow line : supplier.getData().values()) {
                    data.put(String.valueOf(line.getVideoId()), toVideoLineMap(line));
                }
            }
            supplierMap.put("data", data);
            result.put(String.valueOf(supplier.getSupplierId()), supplierMap);
        }
        return result;
    }

    private Map<String, Object> toVideoLineMap(PxbLegacyOrderVideoLineRow line) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("video_id", line.getVideoId());
        map.put("video_title", nullToEmpty(line.getVideoTitle()));
        map.put("video_subtitle", nullToEmpty(line.getVideoSubtitle()));
        map.put("buyway", line.getBuyway() != null ? line.getBuyway() : 2);
        map.put("fullcut", line.getFullcut() != null ? line.getFullcut() : 0);
        map.put("supplier_id", line.getSupplierId());
        map.put("video_price", formatMoney(line.getVideoPrice()));
        return map;
    }

    private static String legacyPayStatusLabel(Integer status) {
        if (status == null) {
            return "待支付";
        }
        return switch (status) {
            case 3 -> "已支付";
            case 4 -> "已取消";
            case 2 -> "支付待确认";
            case -1 -> "已过期";
            default -> "待支付";
        };
    }

    private static String formatMoney(BigDecimal value) {
        BigDecimal amount = value != null ? value : BigDecimal.ZERO;
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
