package com.taoke.legacy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.security.Public;
import com.taoke.legacy.handler.get.GetDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * 培训宝 legacy：/api/get.php
 * <p>
 * opt=trainer|video_state|tkvideo|related_tktrainer；签名参数在 query，tkvideo 业务 JSON 在 POST body 字段 video。
 */
@RestController
@RequestMapping("/api/get.php")
@RequiredArgsConstructor
public class LegacyGetController {

    private final GetDispatcher dispatcher;
    private final ObjectMapper objectMapper;

    @Public
    @RequestMapping(method = {RequestMethod.GET, RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public String handle(HttpServletRequest request) throws Exception {
        Object body = dispatcher.dispatch(request);
        return objectMapper.writeValueAsString(body);
    }
}
