package com.taoke.course.api;

import java.util.Map;

/**
 * 培训宝 legacy get.php opt=video_state。
 */
public interface PxbLegacyVideoStateService {

    Map<String, Object> getDetailStatus(int videoId);
}
