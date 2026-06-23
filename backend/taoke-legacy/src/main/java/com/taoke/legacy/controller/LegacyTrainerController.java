package com.taoke.legacy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.security.Public;
import com.taoke.legacy.handler.trainer.TrainerDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * 培训宝 legacy：/api/trainer.php
 * <p>
 * opt=get_trainer_list|get_trainer_detail；签名在 query，业务参数在 POST body（也兼容 GET）。
 */
@RestController
@RequestMapping("/api/trainer.php")
@RequiredArgsConstructor
public class LegacyTrainerController {

    private final TrainerDispatcher dispatcher;
    private final ObjectMapper objectMapper;

    @Public
    @RequestMapping(method = {RequestMethod.GET, RequestMethod.POST}, produces = MediaType.APPLICATION_JSON_VALUE)
    public String handle(HttpServletRequest request) throws Exception {
        Object body = dispatcher.dispatch(request);
        return objectMapper.writeValueAsString(body);
    }
}
