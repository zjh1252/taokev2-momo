package com.taoke.legacy.filter;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LegacyPxbCdnProxyFilterTest {

    @Test
    void extractPathStripsContextAndPrefix() {
        var request = mock(jakarta.servlet.http.HttpServletRequest.class);
        when(request.getContextPath()).thenReturn("");
        when(request.getRequestURI()).thenReturn("/pxb-videos/old-videos/abc.mp4");
        assertEquals("old-videos/abc.mp4", LegacyPxbCdnProxyFilter.extractPath(request));
    }

    @Test
    void extractPathReturnsEmptyWhenNotMatched() {
        var request = mock(jakarta.servlet.http.HttpServletRequest.class);
        when(request.getContextPath()).thenReturn("");
        when(request.getRequestURI()).thenReturn("/api/search_course.php");
        assertEquals("", LegacyPxbCdnProxyFilter.extractPath(request));
    }
}
