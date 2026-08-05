package com.taoke.legacy.adapter;

import com.taoke.course.dto.pxb.PxbLegacyPurchaseInfo;
import com.taoke.course.dto.pxb.PxbLegacyVideoRow;
import com.taoke.course.service.pxb.PxbLegacyVideoQueryServiceImpl;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * v2 录播课数据 → 培训宝 legacy JSON 字段。
 */
@Component
public class LegacyCourseAdapter {

    public Map<String, Object> toAdsResponse(List<PxbLegacyVideoRow> rows) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (PxbLegacyVideoRow row : rows) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", row.getId());
            map.put("title", row.getTitle());
            map.put("price", row.getPrice());
            map.put("duration", row.getDuration());
            map.put("trainer", normalizeTrainer(row.getTeacherName()));
            map.put("img", row.getCoverUrl());
            map.put("video_url", row.getVideoUrl());
            map.put("v_type", row.getVType());
            map.put("score", row.getScore());
            map.put("groupid", 0);
            map.put("roleid", 0);
            map.put("uid", 0);
            map.put("show_tag", "");
            map.put("cid", row.getCategoryId());
            map.put("cate_name", row.getCategoryName());
            result.put(String.valueOf(row.getId()), map);
        }
        return result;
    }

    public Map<String, Object> toCourseListResponse(long total, List<PxbLegacyVideoRow> rows,
                                                    Map<Integer, PxbLegacyPurchaseInfo> purchases) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("courses_num", total);
        Map<String, Object> courses = new LinkedHashMap<>();
        for (PxbLegacyVideoRow row : rows) {
            courses.put(String.valueOf(row.getId()), toCourseMap(row, purchases.get(row.getId()), true));
        }
        body.put("courses", courses);
        return body;
    }

    public Map<String, Object> toCourseMap(PxbLegacyVideoRow row, PxbLegacyPurchaseInfo purchase, boolean listView) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", row.getId());
        map.put("course_id", row.getId());
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
        applyPurchaseFields(map, purchase);
        if (listView) {
            map.put("uid", 0);
            map.put("roleid", 0);
            map.put("groupid", 0);
        }
        return map;
    }

    /** getCourseBuyStatus：仅 buystatus / starttime / endtime */
    public Map<String, Object> toBuyStatusResponse(List<Integer> courseIds,
                                                   Map<Integer, PxbLegacyPurchaseInfo> purchases) {
        Map<String, Object> result = new LinkedHashMap<>();
        for (Integer id : courseIds) {
            Map<String, Object> item = new LinkedHashMap<>();
            applyPurchaseFields(item, purchases.get(id));
            result.put(String.valueOf(id), item);
        }
        return result;
    }

    public Map<String, Object> toCoursesByIdsResponse(List<PxbLegacyVideoRow> rows,
                                                      Map<Integer, PxbLegacyPurchaseInfo> purchases,
                                                      Map<Integer, List<Map<String, Object>>> seriesByVideoId) {
        Map<String, Object> courses = new LinkedHashMap<>();
        boolean attachSeries = seriesByVideoId != null && !seriesByVideoId.isEmpty();
        for (PxbLegacyVideoRow row : rows) {
            Map<String, Object> item = toCourseMap(row, purchases.get(row.getId()), false);
            item.put("url", "vid=" + row.getId() + "&child=0");
            item.put("pic", row.getCoverUrl());
            item.put("intro", "");
            item.put("types", row.getTotalEpisodes() != null && row.getTotalEpisodes() > 1 ? 1 : 0);
            item.put("teacher", normalizeTrainer(row.getTeacherName()));
            item.put("online_size", 0);
            item.put("course_duration", row.getDuration());
            item.put("package_name", "");
            item.put("buy_status", PxbLegacyVideoQueryServiceImpl.resolveBuyStatus(purchases.get(row.getId())) > 0 ? 1 : 0);
            item.put("is_include_paper", 0);
            if (attachSeries) {
                List<Map<String, Object>> series = seriesByVideoId.getOrDefault(row.getId(), List.of());
                item.put("series", series);
                if (!series.isEmpty()) {
                    item.put("types", 1);
                }
            }
            courses.put(String.valueOf(row.getId()), item);
        }
        return courses;
    }

    private void applyPurchaseFields(Map<String, Object> map, PxbLegacyPurchaseInfo purchase) {
        int buyStatus = PxbLegacyVideoQueryServiceImpl.resolveBuyStatus(purchase);
        map.put("buystatus", buyStatus);
        map.put("starttime", PxbLegacyVideoQueryServiceImpl.toEpochSeconds(
                purchase != null ? purchase.getEnrolledAt() : null));
        map.put("endtime", PxbLegacyVideoQueryServiceImpl.toEpochSeconds(
                purchase != null ? purchase.getExpiredAt() : null));
    }

    private static String normalizeTrainer(String trainer) {
        if (!StringUtils.hasText(trainer)) {
            return "";
        }
        return trainer.replace(" ", "");
    }
}
