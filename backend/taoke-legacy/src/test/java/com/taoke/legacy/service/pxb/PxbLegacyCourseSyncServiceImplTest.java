package com.taoke.legacy.service.pxb;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PxbLegacyCourseSyncServiceImplTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void acceptsPxbAjaxSuccessIsok() throws Exception {
        String body = "{\"isok\":true,\"msg\":\"\\u5b58\\u5165\\u8bfe\\u7a0b\\u5e93\\u6210\\u529f\"}";
        assertTrue(PxbLegacyCourseSyncServiceImpl.isSaveCoursesResponseSuccess(body, objectMapper));
    }

    @Test
    void acceptsLegacyIsOkUnderscore() throws Exception {
        String body = "{\"is_ok\":true,\"msg\":\"ok\"}";
        assertTrue(PxbLegacyCourseSyncServiceImpl.isSaveCoursesResponseSuccess(body, objectMapper));
    }

    @Test
    void rejectsFailureResponse() throws Exception {
        String body = "{\"isok\":false,\"msg\":\"存入课程库失败\"}";
        assertFalse(PxbLegacyCourseSyncServiceImpl.isSaveCoursesResponseSuccess(body, objectMapper));
    }
}
