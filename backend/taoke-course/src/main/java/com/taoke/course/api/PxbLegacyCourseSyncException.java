package com.taoke.course.api;

/** 培训宝课程入库推送失败 */
public class PxbLegacyCourseSyncException extends RuntimeException {

    public PxbLegacyCourseSyncException(String message) {
        super(message);
    }

    public PxbLegacyCourseSyncException(String message, Throwable cause) {
        super(message, cause);
    }
}
