package com.taoke.course.api;

import java.util.Map;

/**
 * 培训宝 legacy get.php opt=tkvideo（add/update/delete）。
 */
public interface PxbLegacyVideoSyncService {

    Map<String, Object> handle(Map<String, Object> payload, int publisherUserId);
}
