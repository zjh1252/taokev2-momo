package com.taoke.legacy.adapter;

import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.course.dto.pxb.PxbLegacyTopicRow;
import com.taoke.course.dto.pxb.PxbLegacyVideoRow;
import com.taoke.course.service.pxb.PxbLegacyVideoQueryServiceImpl;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class LegacyPackageAdapter {

    public Map<String, Object> toTopicResponse(List<PxbLegacyTopicRow> topics) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (PxbLegacyTopicRow topic : topics) {
            result.put(String.valueOf(topic.getId()), toTopicMap(topic));
        }
        return result;
    }

    public Map<String, Object> toTopicCoursesResponse(long coursesNum,
                                                      long videoNum,
                                                      List<PxbLegacyVideoRow> rows,
                                                      Map<Integer, PxbLegacyPurchaseInfo> purchases) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("courses_num", coursesNum);
        body.put("video_num", videoNum > 0 ? videoNum : coursesNum);
        Map<String, Object> courses = new LinkedHashMap<>();
        for (PxbLegacyVideoRow row : rows) {
            courses.put(String.valueOf(row.getId()), toTopicCourseMap(row, purchases.get(row.getId())));
        }
        body.put("courses", courses);
        return body;
    }

    private Map<String, Object> toTopicMap(PxbLegacyTopicRow topic) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", topic.getId());
        map.put("topic_id", topic.getTopicId());
        map.put("item_name", topic.getItemName());
        map.put("item_index", topic.getItemIndex());
        map.put("item_parent", topic.getItemParent());
        map.put("disabled", topic.getDisabled());
        map.put("package", topic.getPackageCode());
        map.put("price", topic.getPrice());
        map.put("company_price", formatCompanyPrice(topic.getCompanyPrice()));
        map.put("descr", topic.getDescr() != null ? topic.getDescr() : "");
        map.put("uid", 0);
        map.put("catalogId", "");
        map.put("taokeId", "");
        map.put("type", topic.getType());
        map.put("serial_index", topic.getSerialIndex());
        map.put("cover", topic.getCover() != null ? topic.getCover() : "");
        map.put("createtime", topic.getCreatetime() != null ? topic.getCreatetime() : 0L);
        map.put("updatetime", topic.getUpdatetime() != null ? topic.getUpdatetime() : 0L);
        map.put("cos_price", 0);
        map.put("cos_company_price", 0);
        map.put("topic_name", topic.getTopicName());
        map.put("buystatus", topic.getBuyStatus() != null ? topic.getBuyStatus() : 0);
        return map;
    }

    private static String formatCompanyPrice(BigDecimal price) {
        BigDecimal value = price != null ? price : BigDecimal.ZERO;
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private Map<String, Object> toTopicCourseMap(PxbLegacyVideoRow row, PxbLegacyPurchaseInfo purchase) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", row.getId());
        map.put("title", row.getTitle());
        map.put("price", row.getPrice());
        map.put("trainer", normalizeTrainer(row.getTeacherName()));
        map.put("img", row.getCoverUrl());
        map.put("video_url", row.getVideoUrl());
        map.put("v_type", row.getVType());
        map.put("score", row.getScore());
        map.put("duration", row.getDuration());
        map.put("cid", row.getCategoryId());
        map.put("cate_name", row.getCategoryName());
        int buyStatus = PxbLegacyVideoQueryServiceImpl.resolveBuyStatus(purchase);
        map.put("buystatus", buyStatus);
        map.put("starttime", PxbLegacyVideoQueryServiceImpl.toEpochSeconds(
                purchase != null ? purchase.getEnrolledAt() : null));
        map.put("endtime", PxbLegacyVideoQueryServiceImpl.toEpochSeconds(
                purchase != null ? purchase.getExpiredAt() : null));
        return map;
    }

    private static String normalizeTrainer(String trainer) {
        return trainer != null ? trainer.replace(" ", "") : "";
    }
}
