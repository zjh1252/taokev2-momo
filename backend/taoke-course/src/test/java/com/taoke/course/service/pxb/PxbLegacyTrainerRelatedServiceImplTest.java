package com.taoke.course.service.pxb;

import com.taoke.course.entity.pxb.PxbTrainerRelatedLog;
import com.taoke.course.repository.pxb.PxbTrainerRelatedLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PxbLegacyTrainerRelatedServiceImplTest {

    @Mock
    private PxbTrainerRelatedLogRepository relatedLogRepository;

    @InjectMocks
    private PxbLegacyTrainerRelatedServiceImpl service;

    @Test
    void addRelated_insertsWhenPairNotExists() {
        when(relatedLogRepository.findByTrainerUidAndPxbUid(201982, 1302678)).thenReturn(Optional.empty());
        when(relatedLogRepository.save(any(PxbTrainerRelatedLog.class))).thenAnswer(inv -> inv.getArgument(0));

        service.addRelated(201982, 1302678, "EV1817", "");

        ArgumentCaptor<PxbTrainerRelatedLog> captor = ArgumentCaptor.forClass(PxbTrainerRelatedLog.class);
        verify(relatedLogRepository).save(captor.capture());
        PxbTrainerRelatedLog saved = captor.getValue();
        assertEquals(201982, saved.getTrainerUid());
        assertEquals(1302678, saved.getPxbUid());
        assertEquals("EV1817", saved.getPxbUsername());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    void addRelated_updatesWhenPairExists() {
        PxbTrainerRelatedLog existing = new PxbTrainerRelatedLog();
        existing.setId(1);
        existing.setTrainerUid(201982);
        existing.setPxbUid(1302678);
        existing.setPxbUsername("OLD");
        existing.setMobile("13800000000");
        existing.setCreatedAt(LocalDateTime.of(2026, 6, 24, 13, 59, 6));

        when(relatedLogRepository.findByTrainerUidAndPxbUid(201982, 1302678)).thenReturn(Optional.of(existing));
        when(relatedLogRepository.save(existing)).thenReturn(existing);

        service.addRelated(201982, 1302678, "EV1817", "13900000000");

        assertEquals(1, existing.getId());
        assertEquals("EV1817", existing.getPxbUsername());
        assertEquals("13900000000", existing.getMobile());
        assertEquals(LocalDateTime.of(2026, 6, 24, 13, 59, 6), existing.getCreatedAt());
        verify(relatedLogRepository).save(existing);
    }
}
