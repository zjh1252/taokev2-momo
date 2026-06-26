package com.taoke.course.service.pxb;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PxbLegacyCourseSyncServiceImplTest {

    @Test
    void syncPxbResourceTypes_mapsSurveyExamTracking() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.update(eq("UPDATE taoke.tk_courseinfo SET pxb_resoure = ? WHERE id = ?"), eq("1,2,3"), eq(1001)))
                .thenReturn(1);

        PxbLegacyCourseSyncServiceImpl service = new PxbLegacyCourseSyncServiceImpl(jdbc);
        boolean ok = service.syncPxbResourceTypes(Map.of(
                "1001", Map.of(
                        "14", Map.of("resource_type", 14),
                        "8", Map.of("resource_type", 8),
                        "15", Map.of("resource_type", 15)
                )
        ));

        assertTrue(ok);
    }

    @Test
    void syncPxbResourceTypes_emptyPayload() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        PxbLegacyCourseSyncServiceImpl service = new PxbLegacyCourseSyncServiceImpl(jdbc);
        assertFalse(service.syncPxbResourceTypes(Map.of()));
    }
}
