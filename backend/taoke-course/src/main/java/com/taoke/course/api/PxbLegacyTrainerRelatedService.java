package com.taoke.course.api;

/**
 * 培训宝 legacy get.php opt=related_tktrainer。
 */
public interface PxbLegacyTrainerRelatedService {

    void addRelated(int trainerUid, int pxbUid, String pxbUsername, String mobile);
}
