package com.taoke.user.controller;

import com.taoke.user.api.TrainerService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TrainerControllerGuidedCountsTest {

    @Test
    void exposesChildExpertiseCountsAndIndustryCounts() {
        TrainerService service = mock(TrainerService.class);
        when(service.countPublicByExpertiseL1(true)).thenReturn(Map.of(88, 20L, 90, 8L));
        when(service.countPublicByIndustry()).thenReturn(Map.of(158, 12L));
        TrainerController controller = new TrainerController(service);

        var expertise = controller.expertiseCategoryCounts(true);
        var industries = controller.industryCategoryCounts();

        assertEquals(Map.of(88, 20L, 90, 8L), expertise.getData());
        assertEquals(Map.of(158, 12L), industries.getData());
        verify(service).countPublicByExpertiseL1(true);
        verify(service).countPublicByIndustry();
    }
}
