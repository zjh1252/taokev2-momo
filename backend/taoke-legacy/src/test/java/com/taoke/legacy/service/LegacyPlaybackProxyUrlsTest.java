package com.taoke.legacy.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LegacyPlaybackProxyUrlsTest {

    @Test
    void rewritesPxbCdnToSameOriginPath() {
        String cdn = "https://cdn5-pxb-videos.taoke.com/old-videos/abc.mp4";
        assertEquals("/pxb-videos/old-videos/abc.mp4", LegacyPlaybackProxyUrls.toSameOriginProxy(cdn));
    }

    @Test
    void buildsAbsoluteProxyUrl() {
        String cdn = "https://cdn5-pxb-videos.taoke.com/old-videos/abc.mp4";
        assertEquals(
                "http://local.taokenew.com:8080/pxb-videos/old-videos/abc.mp4",
                LegacyPlaybackProxyUrls.toAbsoluteProxy(cdn, "http://local.taokenew.com:8080"));
    }
}
