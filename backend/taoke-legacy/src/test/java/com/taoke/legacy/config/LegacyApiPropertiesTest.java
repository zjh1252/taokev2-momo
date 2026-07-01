package com.taoke.legacy.config;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LegacyApiPropertiesTest {

    @Test
    void resolveOutboundUrl_usesPartnerUrlAsIs() {
        LegacyApiProperties props = new LegacyApiProperties();
        props.setSignatureUrls(Map.of(
                "wittrain", "https://training.example.com/api/tt_course/add_tt_course.php"
        ));

        assertTrue(props.isPartnerApp("wittrain"));
        assertEquals(
                "https://training.example.com/api/tt_course/add_tt_course.php",
                props.resolveOutboundUrl("wittrain")
        );
    }

    @Test
    void resolveOutboundUrl_pxbDefaultForcesHttp() {
        LegacyApiProperties props = new LegacyApiProperties();
        LegacyApiProperties.PxbOutboundProperties outbound = props.getPxbOutbound();
        outbound.setBaseUrl("https://dev.91pxb.com");
        outbound.setApiPath("/api/tt_course/add_tt_course.php");

        assertFalse(props.isPartnerApp("taoke"));
        assertEquals(
                "http://dev.91pxb.com/api/tt_course/add_tt_course.php",
                props.resolveOutboundUrl("taoke")
        );
    }

    @Test
    void isPartnerApp_falseWhenUrlEmpty() {
        LegacyApiProperties props = new LegacyApiProperties();
        props.setSignatureUrls(Map.of("wittrain", ""));

        assertFalse(props.isPartnerApp("wittrain"));
    }
}
