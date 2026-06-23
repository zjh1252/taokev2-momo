package com.taoke.legacy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.security.Public;
import com.taoke.legacy.handler.searchcourse.SearchCourseDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * 培训宝 legacy：/api/search_course.php
 * <p>
 * URL 形态与老站一致：?opt=...&amp;appid=pxb&amp;timetamp=...&amp;signature=...
 * 业务参数通常在 POST body（application/x-www-form-urlencoded）；也兼容 GET 查询串（便于联调）。
 */
@RestController
@RequestMapping("/api/search_course.php")
@RequiredArgsConstructor
public class LegacySearchCourseController {

    private final SearchCourseDispatcher dispatcher;
    private final ObjectMapper objectMapper;

    @Public
    @RequestMapping(method = {RequestMethod.GET, RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public String handle(HttpServletRequest request) throws Exception {
        Object body = dispatcher.dispatch(request);
        return objectMapper.writeValueAsString(body);
    }
}
