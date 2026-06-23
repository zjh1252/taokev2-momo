package com.taoke.course.api;

import java.util.Map;

/**
 * 培训宝 sync_course：回写老库 tk_courseinfo.pxb_resoure（调研/考试/行动标记）。
 */
public interface PxbLegacyCourseSyncService {

    /**
     * @param coursesPayload 老站 courses JSON：tk_course_id → 资源列表
     * @return 是否至少更新一条
     */
    boolean syncPxbResourceTypes(Map<String, Object> coursesPayload);
}
