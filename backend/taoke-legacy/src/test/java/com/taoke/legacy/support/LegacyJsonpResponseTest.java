package com.taoke.legacy.support;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LegacyJsonpResponseTest {

    @Test
    void acceptsFetchJsonpCallbackName() {
        assertTrue(LegacyJsonpResponse.isValidCallback("jsonp_1783043441468_45529"));
    }

    @Test
    void rejectsUnsafeCallback() {
        assertFalse(LegacyJsonpResponse.isValidCallback("alert(1)"));
    }

    @Test
    void wrapsWithJavascriptContentType() {
        ResponseEntity<String> resp = LegacyJsonpResponse.ok("{\"isok\":true}", "jsonp_test");
        assertEquals(MediaType.parseMediaType("application/javascript;charset=UTF-8"),
                resp.getHeaders().getContentType());
        assertEquals("jsonp_test({\"isok\":true})", resp.getBody());
    }

    @Test
    void fallsBackToJsonWithoutCallback() {
        ResponseEntity<String> resp = LegacyJsonpResponse.ok("{\"isok\":true}", null);
        assertEquals(MediaType.APPLICATION_JSON, resp.getHeaders().getContentType());
        assertEquals("{\"isok\":true}", resp.getBody());
    }
}
