package com.taoke.course.dto.pxb;

import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 培训宝 add_tt_course.php opt=saveCourses 推送参数 */
@Data
@Builder
public class PxbLegacyCourseSyncCommand {

    /** 培训宝 cdbid（UC uid），非本地 sys_users.id */
    private int pxbUid;
    /** 待入库视频 ID（包订单为每个系列 1 个代表 video_id） */
    private List<Integer> videoIds;
    /** video_id → packageId（老站 topic_item.id） */
    @Builder.Default
    private Map<Integer, Integer> packagesRelation = new LinkedHashMap<>();
    private int isIncludePaper;
    private int copyRootId;
    /** 老站 pxbStorage 固定传 0，与 pxb_root_id 分离 */
    private int rootCompanyId;
    private int pxbRootId;

    /** restore 诊断：推送前参数预览 */
    public Map<String, Object> toDiagnosticPreview() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("uid", pxbUid);
        map.put("video_ids", videoIds != null ? new ArrayList<>(videoIds) : List.of());
        map.put("pxb_root_id", pxbRootId);
        map.put("root_company_id", rootCompanyId);
        map.put("is_include_paper", isIncludePaper);
        map.put("copy_root_id", copyRootId);
        if (packagesRelation != null && !packagesRelation.isEmpty()) {
            map.put("packages_relation", new LinkedHashMap<>(packagesRelation));
        }
        return map;
    }
}
