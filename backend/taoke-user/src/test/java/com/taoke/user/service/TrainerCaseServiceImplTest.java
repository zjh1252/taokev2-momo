package com.taoke.user.service;

import com.taoke.common.eventbus.EventPublisher;
import com.taoke.user.dto.trainercase.TrainerCaseRecentResponse;
import com.taoke.user.entity.TrainerCase;
import com.taoke.user.repository.InstitutionRepository;
import com.taoke.user.repository.InstitutionTrainerBindingRepository;
import com.taoke.user.repository.TrainerCaseFileRepository;
import com.taoke.user.repository.TrainerCaseRepository;
import com.taoke.user.repository.TrainerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrainerCaseServiceImplTest {

    @Mock private TrainerCaseRepository caseRepository;
    @Mock private TrainerCaseFileRepository caseFileRepository;
    @Mock private TrainerRepository trainerRepository;
    @Mock private InstitutionRepository institutionRepository;
    @Mock private InstitutionTrainerBindingRepository institutionTrainerBindingRepository;
    @Mock private EventPublisher eventPublisher;

    @InjectMocks
    private TrainerCaseServiceImpl service;

    @Test
    void listRecentApprovedReturnsTruncatedDescriptionPreview() {
        TrainerCase trainerCase = new TrainerCase();
        trainerCase.setId(1);
        trainerCase.setTrainerId(10);
        trainerCase.setDescription("案".repeat(121));
        when(caseRepository.findRecentApproved(any(Pageable.class))).thenReturn(List.of(trainerCase));
        when(trainerRepository.findAllById(any())).thenReturn(List.of());

        List<TrainerCaseRecentResponse> result = service.listRecentApproved(10);

        assertEquals("案".repeat(120), result.getFirst().getDescription());
    }
}
