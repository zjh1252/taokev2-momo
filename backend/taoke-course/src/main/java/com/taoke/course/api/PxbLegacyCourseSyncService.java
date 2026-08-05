package com.taoke.course.api;

import com.taoke.course.dto.pxb.PxbLegacyCourseSyncCommand;
import com.taoke.course.dto.pxb.PxbLegacyCourseSyncResult;

/**
 * 淘课 → 培训宝在线课程入库（add_tt_course.php opt=saveCourses）。
 */
public interface PxbLegacyCourseSyncService {

    PxbLegacyCourseSyncResult syncVideosToPxb(PxbLegacyCourseSyncCommand command);
}
