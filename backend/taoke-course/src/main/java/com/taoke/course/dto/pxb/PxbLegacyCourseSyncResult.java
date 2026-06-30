package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** saveCourses 推送结果（restore 诊断 pxb_sync 块） */
@Data
@Builder
public class PxbLegacyCourseSyncResult {

    private boolean pushed;
    @Builder.Default
    private boolean skipped = false;
    private String skipReason;
    private String url;
    private String appid;
    private int uid;
    @Builder.Default
    private List<Integer> videoIds = List.of();
    private int pxbRootId;
    private int rootCompanyId;
    private int isIncludePaper;
    private int httpStatus;
    private String pxbResponse;

    public Map<String, Object> toDiagnosticMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("pushed", pushed);
        if (skipped) {
            map.put("skipped", true);
            map.put("skip_reason", skipReason != null ? skipReason : "");
        }
        if (url != null) {
            map.put("url", url);
        }
        if (appid != null) {
            map.put("appid", appid);
        }
        map.put("uid", uid);
        map.put("video_ids", videoIds != null ? new ArrayList<>(videoIds) : List.of());
        map.put("pxb_root_id", pxbRootId);
        map.put("root_company_id", rootCompanyId);
        map.put("is_include_paper", isIncludePaper);
        if (httpStatus > 0) {
            map.put("http_status", httpStatus);
        }
        if (pxbResponse != null) {
            map.put("pxb_response", pxbResponse);
        }
        return map;
    }
}
