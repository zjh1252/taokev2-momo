package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplyRequest;
import com.taoke.user.dto.alliance.AllianceAmbassadorApplicationResponse;
import com.taoke.user.entity.AllianceAmbassadorApplication;
import com.taoke.user.repository.AllianceAmbassadorApplicationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AllianceAmbassadorApplicationServiceImplTest {

    @Mock
    AllianceAmbassadorApplicationRepository repository;

    @Mock
    AllianceAmbassadorNotificationSender notificationSender;

    @InjectMocks
    AllianceAmbassadorApplicationServiceImpl service;

    @Test
    void submit_rejectsWhenAgreementNotSigned() {
        AllianceAmbassadorApplyRequest request = validRequest();
        request.setAgreementSigned(false);

        BusinessException exception = assertThrows(
                BusinessException.class, () -> service.submit(1, request));

        assertEquals("请先勾选并同意协议", exception.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void submit_rejectsWhenPendingExists() {
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 1))
                .thenReturn(Optional.of(new AllianceAmbassadorApplication()));

        assertThrows(BusinessException.class, () -> service.submit(1, validRequest()));
        verify(repository, never()).save(any());
    }

    @Test
    void submit_rejectsWhenAlreadyApproved() {
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 1)).thenReturn(Optional.empty());
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 2))
                .thenReturn(Optional.of(new AllianceAmbassadorApplication()));

        assertThrows(BusinessException.class, () -> service.submit(1, validRequest()));
    }

    @Test
    void submit_createsPendingWithAmbassadorCode() {
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> {
            AllianceAmbassadorApplication application = invocation.getArgument(0);
            application.setId(10);
            return application;
        });

        AllianceAmbassadorApplicationResponse response = service.submit(42, validRequest());

        assertEquals(1, response.getStatus());
        assertTrue(response.getAmbassadorCode().startsWith("AMB_"));
        assertTrue(response.getAmbassadorCode().endsWith("000042"));
        assertEquals("v1", response.getAgreementVersion());
    }

    @Test
    void getLatestByUserId_returnsNullWhenMissing() {
        when(repository.findFirstByUserIdOrderByIdDesc(42)).thenReturn(Optional.empty());
        assertNull(service.getLatestByUserId(42));
    }

    @Test
    void approve_sendsApplyPassed() {
        AllianceAmbassadorApplication application = pendingApp(5, 42);
        when(repository.findById(5)).thenReturn(Optional.of(application));
        when(repository.approveIfPending(eq(5), any(LocalDateTime.class), eq(99))).thenReturn(1);

        service.approve(5, 99);

        verify(notificationSender).sendReviewResult(5, 42, "APPLY_PASSED", "");
    }

    @Test
    void reject_requiresReason() {
        assertThrows(BusinessException.class, () -> service.reject(5, 99, "  "));
        verify(repository, never()).rejectIfPending(any(), any(), any(), any());
    }

    @Test
    void reject_sendsApplyRejected() {
        AllianceAmbassadorApplication application = pendingApp(5, 42);
        when(repository.findById(5)).thenReturn(Optional.of(application));
        when(repository.rejectIfPending(eq(5), eq("资料不全"), any(LocalDateTime.class), eq(99)))
                .thenReturn(1);

        service.reject(5, 99, "资料不全");

        ArgumentCaptor<String> reasonCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificationSender).sendReviewResult(
                eq(5), eq(42), eq("APPLY_REJECTED"), reasonCaptor.capture());
        assertEquals("资料不全", reasonCaptor.getValue());
    }

    private AllianceAmbassadorApplyRequest validRequest() {
        AllianceAmbassadorApplyRequest request = new AllianceAmbassadorApplyRequest();
        request.setAgreementSigned(true);
        request.setAgreementVersion("v1");
        return request;
    }

    private AllianceAmbassadorApplication pendingApp(Integer id, Integer userId) {
        AllianceAmbassadorApplication application = new AllianceAmbassadorApplication();
        application.setId(id);
        application.setUserId(userId);
        application.setAmbassadorCode("AMB_TEST");
        application.setAgreementVersion("v1");
        application.setStatus(1);
        return application;
    }
}
