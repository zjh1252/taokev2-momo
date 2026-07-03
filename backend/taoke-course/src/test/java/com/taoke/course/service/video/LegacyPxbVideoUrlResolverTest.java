package com.taoke.course.service.video;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LegacyPxbVideoUrlResolverTest {

    private final LegacyPxbVideoUrlResolver resolver = new LegacyPxbVideoUrlResolver();

    @Test
    void bareMd5UsesOldVideosPath() {
        String hash = "9c5728ce827c6967d55374cb9035b587";
        assertEquals(
                "https://cdn5-pxb-videos.taoke.com/old-videos/" + hash + ".mp4",
                resolver.resolve(hash));
    }

    @Test
    void fixesV88MisMigrationUrl() {
        String hash = "9c5728ce827c6967d55374cb9035b587";
        String wrong = "https://cdn5-pxb-videos.taoke.com/taoke/old-videos/videos/" + hash + ".mp4";
        String fixed = "https://cdn5-pxb-videos.taoke.com/old-videos/" + hash + ".mp4";
        assertEquals(fixed, resolver.fixMisMigratedFullUrl(wrong));
        assertEquals(fixed, resolver.resolve(wrong));
    }
}
