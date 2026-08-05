package com.taoke.course.service.video;

import com.taoke.course.config.LegacyThirdPartyVideoProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ZgxPlaybackSignerTest {

    private final ZgxPlaybackSigner signer = new ZgxPlaybackSigner(new LegacyThirdPartyVideoProperties());

    @Test
    void aliOssVideoUsesMd5Path() {
        var signed = signer.sign("abc12345", 11, true);
        assertTrue(signed.embedUrl().contains("/taoke/zgx/videos/"));
        assertTrue(signed.embedUrl().endsWith(".mp4"));
    }

    @Test
    void buildLocalPlayUrlMatchesLegacyPattern() {
        String local = ZgxPlaybackSigner.buildLocalPlayUrl("ab12", 11, "zgx");
        assertTrue(local.contains("/taoke/old-videos/supplier/zgx/ab/ab12.mp4"));
    }
}
