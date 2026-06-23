package com.taoke.legacy.handler.searchcourse;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

/**
 * search_course.php opt 处理器。
 */
public interface SearchCourseOptHandler {

    String opt();

    Object handle(HttpServletRequest request);
}
