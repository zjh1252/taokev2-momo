package com.taoke.legacy.service;

import com.taoke.course.api.PxbLegacyVideoQueryService;
import com.taoke.course.dto.pxb.PxbLegacyMobilePlaybackResult;
import com.taoke.legacy.security.LegacySignatureService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LegacyMobilePlayerServiceTest {

    @Mock
    private LegacySignatureService signatureService;
    @Mock
    private PxbUserResolver userResolver;
    @Mock
    private PxbLegacyVideoQueryService legacyVideoQueryService;
    @Mock
    private LegacyConcurrencyLimiterService concurrencyLimiterService;
    @Mock
    private LegacyMobileSupplierHtmlRenderer supplierHtmlRenderer;
    @Mock
    private LegacyMobilePlayerHtmlRenderer playerHtmlRenderer;

    private LegacyMobilePlayerService service;

    @BeforeEach
    void setUp() {
        service = new LegacyMobilePlayerService(
                signatureService,
                userResolver,
                legacyVideoQueryService,
                concurrencyLimiterService,
                supplierHtmlRenderer,
                playerHtmlRenderer);
    }

    @Test
    void missingVideoUrlRejected() {
        LegacyMobilePlayResult result = service.play(
                1, 1_700_000_000L, 100, "token", "", "pxb", 0, true, false, "http://localhost:8080");
        assertEquals(LegacyMobilePlayResult.Kind.JSON, result.getKind());
        assertFalse((Boolean) result.getJsonBody().get("isok"));
    }

    @Test
    void successfulJsonPlaybackUsesFixedEndtime() {
        when(signatureService.verifySortedData(anyMap(), eq("pxb"), eq("token"))).thenReturn(true);
        when(signatureService.isTimestampValid(eq("taokevideo"), anyLong())).thenReturn(true);
        when(userResolver.resolveUserId("pxb", 1)).thenReturn(10);
        when(legacyVideoQueryService.resolveMobilePlayback(10, 100, 0, null))
                .thenReturn(PxbLegacyMobilePlaybackResult.playback(
                        1, false, "https://cdn.example/a.mp4", "https://cdn.example/p.jpg", false, 1024L));
        when(legacyVideoQueryService.resolvePlaybackConcurrencyLimit(10, 100, null)).thenReturn(2);
        when(concurrencyLimiterService.buildResourceId(10, 100)).thenReturn("tk_vco_10_100");
        when(concurrencyLimiterService.acquireSlot("tk_vco_10_100", 2)).thenReturn("slot1");

        String encoded = java.util.Base64.getEncoder().encodeToString("vid=100&child=0".getBytes());
        LegacyMobilePlayResult result = service.play(
                1, 1_700_000_000L, 100, "token", encoded, "pxb", 0, true, false, "http://localhost:8080");

        assertTrue((Boolean) result.getJsonBody().get("isok"));
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getJsonBody().get("data");
        @SuppressWarnings("unchecked")
        Map<String, Object> limit = (Map<String, Object>) data.get("limit");
        assertEquals(3600, limit.get("endtime"));
    }
}
