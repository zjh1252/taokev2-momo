package com.taoke.course.api;

import java.util.Map;

/**
 * 培训宝 → 淘课：同步课程关联资源类型（sync_course opt）。
 */
public interface PxbLegacyResourceTypeSyncService {

    boolean syncPxbResourceTypes(Map<String, Object> coursesPayload);
}
