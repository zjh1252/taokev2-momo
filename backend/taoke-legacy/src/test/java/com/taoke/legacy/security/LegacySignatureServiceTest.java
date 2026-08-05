package com.taoke.legacy.security;

import com.taoke.legacy.config.LegacyApiProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LegacySignatureServiceTest {

    private LegacySignatureService service;

    @BeforeEach
    void setUp() {
        LegacyApiProperties properties = new LegacyApiProperties();
        properties.getSignatureKeys().put("pxb", "fn234gyty4542");
        properties.getSignatureKeys().put("taoke", "adfdsrve34243");
        service = new LegacySignatureService(properties);
    }

    @Test
    void verify_acceptsValidSignature() {
        long ts = 1719000000L;
        String sig = service.sign("pxb", ts, "courseList");
        assertTrue(sig.matches("[0-9a-f]{32}"));
        assertTrue(service.verify("pxb", ts, "courseList", sig));
    }

    @Test
    void verify_rejectsTamperedSignature() {
        assertFalse(service.verify("pxb", 1719000000L, "courseList", "deadbeef"));
    }
}
