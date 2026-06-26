package com.taoke.legacy.security;

import com.taoke.legacy.config.LegacyApiProperties;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 与 Python 联调脚本 {@code backend/scripts/pxb-legacy-smoke.py} 签名算法对齐。
 */
class LegacySignatureCrossCheckTest {

    private final LegacySignatureService service = new LegacySignatureService(new LegacyApiProperties());

    @Test
    void searchCourseSignature_fixedTimestamp_matchesGoldenHash() {
        long ts = 1719000000L;
        String sig = service.sign("pxb", ts, "courseList");
        // Python/PowerShell: md5("appid=pxb&opt=courseList&timetamp=1719000000" + secret)
        assertEquals("354c97b0688a485da6d818584dd6247e", sig);
    }

    @Test
    void searchCourseSignature_fixedTimestamp_isStable() {
        long ts = 1719000000L;
        String sig = service.sign("pxb", ts, "courseList");
        assertTrue(sig.matches("[0-9a-f]{32}"));
        assertEquals(sig, service.sign("pxb", ts, "courseList"));
    }

    @Test
    void playerSignature_usesSortedKeys() {
        Map<String, String> data = new TreeMap<>();
        data.put("appid", "pxb");
        data.put("cdbid", "12345");
        data.put("timetamp", "1719000000");
        data.put("video_id", "1001");
        String sig = service.signSortedData(data, "pxb");
        assertEquals(32, sig.length());
        // ksort 顺序: appid, cdbid, timetamp, video_id
        assertEquals(
                LegacySignatureService.md5Hex(
                        "appid=pxb&cdbid=12345&timetamp=1719000000&video_id=1001" + "fn234gyty4542"),
                sig);
    }

    @Test
    void verify_acceptsSignFromSortedData() {
        Map<String, String> data = new TreeMap<>();
        data.put("appid", "pxb");
        data.put("opt", "adsList");
        data.put("timetamp", "1719000000");
        String sig = service.signSortedData(data, "pxb");
        assertTrue(service.verify("pxb", 1719000000L, "adsList", sig));
    }
}
