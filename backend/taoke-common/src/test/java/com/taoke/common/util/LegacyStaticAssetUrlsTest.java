package com.taoke.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LegacyStaticAssetUrlsTest {

    private static final String CDN = "http://cdn.test.taoke.com/taoke/";
    private static final String MAIN = "https://www.taoke.com/";

    @Test
    void attachmentsPathUsesCdn() {
        assertEquals(
                "http://cdn.test.taoke.com/taoke/attachments/user/middle/201982/201982.jpg",
                LegacyStaticAssetUrls.resolve("attachments/user/middle/201982/201982.jpg", CDN, MAIN));
    }

    @Test
    void leadingSlashIsStripped() {
        assertEquals(
                "http://cdn.test.taoke.com/taoke/statics/images/trainers/201982.jpg",
                LegacyStaticAssetUrls.resolve("/statics/images/trainers/201982.jpg", CDN, MAIN));
    }

    @Test
    void uPathUsesMainSite() {
        assertEquals(
                "https://www.taoke.com/u/avatar/123.jpg",
                LegacyStaticAssetUrls.resolve("u/avatar/123.jpg", CDN, MAIN));
    }

    @Test
    void prodCdnAbsoluteUrlRewritesToConfiguredBase() {
        assertEquals(
                "http://cdn.test.taoke.com/taoke/attachments/user/middle/201982/201982.jpg",
                LegacyStaticAssetUrls.resolve(
                        "https://cdn-static.taoke.com/taoke/attachments/user/middle/201982/201982.jpg",
                        CDN, MAIN));
    }

    @Test
    void unknownAbsoluteUrlUnchanged() {
        String url = "https://example.com/assets/a.png";
        assertEquals(url, LegacyStaticAssetUrls.resolve(url, CDN, MAIN));
    }

    @Test
    void extractLegacyRelativePathFromProdCdn() {
        assertEquals(
                "attachments/a.png",
                LegacyStaticAssetUrls.extractLegacyRelativePath(
                        "https://cdn-static.taoke.com/taoke/attachments/a.png"));
    }

    @Test
    void blankReturnsEmpty() {
        assertEquals("", LegacyStaticAssetUrls.resolve(null, CDN, MAIN));
        assertEquals("", LegacyStaticAssetUrls.resolve("  ", CDN, MAIN));
    }

    @Test
    void extractLegacyRelativePathReturnsNullForUnknownHost() {
        assertNull(LegacyStaticAssetUrls.extractLegacyRelativePath("https://example.com/a.png"));
    }
}
