package com.taoke.user.service;

import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.NotificationType;
import com.taoke.common.exception.BusinessException;
import com.taoke.user.api.NotificationService;
import com.taoke.user.api.NotificationTemplateService;
import com.taoke.user.dto.alliance.AlliancePartnerApplyRequest;
import com.taoke.user.dto.alliance.AlliancePartnerApplicationResponse;
import com.taoke.user.dto.notification.RenderedTemplate;
import com.taoke.user.entity.AlliancePartnerApplication;
import com.taoke.user.repository.AlliancePartnerApplicationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AlliancePartnerApplicationServiceImplTest {

    @Mock
    AlliancePartnerApplicationRepository repository;

    @Mock
    AlliancePartnerNotificationSender notificationSender;

    @Mock
    NotificationTemplateService templateService;

    @Mock
    NotificationService notificationService;

    @InjectMocks
    AlliancePartnerApplicationServiceImpl service;

    @Test
    void submit_rejectsWhenAgreementNotSigned() {
        AlliancePartnerApplyRequest request = validRequest();
        request.setAgreementSigned(false);

        BusinessException exception = assertThrows(BusinessException.class, () -> service.submit(1, request));

        assertEquals("请先勾选并同意协议", exception.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void submit_rejectsWhenPendingExists() {
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 1))
                .thenReturn(Optional.of(new AlliancePartnerApplication()));

        assertThrows(BusinessException.class, () -> service.submit(1, validRequest()));
    }

    @Test
    void submit_rejectsWhenAlreadyApproved() {
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 1)).thenReturn(Optional.empty());
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 2))
                .thenReturn(Optional.of(new AlliancePartnerApplication()));

        assertThrows(BusinessException.class, () -> service.submit(1, validRequest()));
    }

    @Test
    void submit_createsPendingWithPartnerCode() {
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> {
            AlliancePartnerApplication application = invocation.getArgument(0);
            application.setId(10);
            return application;
        });

        AlliancePartnerApplicationResponse response = service.submit(42, validRequest());

        assertEquals(1, response.getStatus());
        assertTrue(response.getPartnerCode().startsWith("TPC_"));
        assertTrue(response.getPartnerCode().endsWith("000042"));
        assertEquals("v1", response.getAgreementVersion());

        ArgumentCaptor<AlliancePartnerApplication> captor =
                ArgumentCaptor.forClass(AlliancePartnerApplication.class);
        verify(repository).save(captor.capture());
        assertEquals("联系人", captor.getValue().getContactName());
        assertEquals(310000, captor.getValue().getProvinceId());
    }

    @Test
    void getLatestByUserId_returnsNullWhenMissing() {
        when(repository.findFirstByUserIdOrderByIdDesc(42)).thenReturn(Optional.empty());

        assertNull(service.getLatestByUserId(42));
    }

    @Test
    void pageForAdmin_filtersStatusAndUsesOneBasedPage() {
        AlliancePartnerApplication application = pendingApp(5, 42);
        when(repository.findByStatus(eq(1), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(application)));

        PageResult<AlliancePartnerApplicationResponse> result = service.pageForAdmin(1, 2, 20);

        assertEquals(2, result.getPage());
        assertEquals(20, result.getSize());
        assertEquals(1, result.getTotal());
        assertEquals(5, result.getList().getFirst().getId());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findByStatus(eq(1), captor.capture());
        assertEquals(1, captor.getValue().getPageNumber());
    }

    @Test
    void getById_throwsWhenMissing() {
        when(repository.findById(99)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> service.getById(99));
    }

    @Test
    void approve_sendsApplyPassed() {
        AlliancePartnerApplication application = pendingApp(5, 42);
        when(repository.findById(5)).thenReturn(Optional.of(application));

        service.approve(5, 99);

        assertEquals(2, application.getStatus());
        assertEquals(99, application.getReviewedBy());
        verify(notificationSender).sendReviewResult(5, 42, "APPLY_PASSED", "");
    }

    @Test
    void approve_rejectsNonPendingApplication() {
        AlliancePartnerApplication application = pendingApp(5, 42);
        application.setStatus(2);
        when(repository.findById(5)).thenReturn(Optional.of(application));

        assertThrows(BusinessException.class, () -> service.approve(5, 99));
        verify(notificationSender, never()).sendReviewResult(anyInt(), anyInt(), any(), any());
    }

    @Test
    void reject_requiresReason() {
        assertThrows(BusinessException.class, () -> service.reject(5, 99, "  "));

        verify(repository, never()).findById(anyInt());
    }

    @Test
    void reject_sendsApplyRejectedWithReason() {
        AlliancePartnerApplication application = pendingApp(5, 42);
        when(repository.findById(5)).thenReturn(Optional.of(application));

        service.reject(5, 99, "材料不完整");

        assertEquals(3, application.getStatus());
        assertEquals("材料不完整", application.getRejectReason());
        verify(notificationSender)
                .sendReviewResult(5, 42, "APPLY_REJECTED", "材料不完整");
    }

    @Test
    void approve_sendsNotificationAfterCommitAndSwallowsFailure() {
        AlliancePartnerApplication application = pendingApp(5, 42);
        when(repository.findById(5)).thenReturn(Optional.of(application));
        doThrow(new RuntimeException("notification failed"))
                .when(notificationSender)
                .sendReviewResult(5, 42, "APPLY_PASSED", "");

        TransactionSynchronizationManager.initSynchronization();
        try {
            service.approve(5, 99);

            assertEquals(2, application.getStatus());
            verify(repository).save(application);
            verifyNoInteractions(notificationSender);

            for (TransactionSynchronization synchronization
                    : TransactionSynchronizationManager.getSynchronizations()) {
                synchronization.afterCommit();
            }
            verify(notificationSender).sendReviewResult(5, 42, "APPLY_PASSED", "");
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void reject_sendsNotificationAfterCommitAndSwallowsFailure() {
        AlliancePartnerApplication application = pendingApp(5, 42);
        when(repository.findById(5)).thenReturn(Optional.of(application));
        doThrow(new RuntimeException("notification failed"))
                .when(notificationSender)
                .sendReviewResult(5, 42, "APPLY_REJECTED", "材料不完整");

        TransactionSynchronizationManager.initSynchronization();
        try {
            service.reject(5, 99, "材料不完整");

            assertEquals(3, application.getStatus());
            verify(repository).save(application);
            verifyNoInteractions(notificationSender);

            for (TransactionSynchronization synchronization
                    : TransactionSynchronizationManager.getSynchronizations()) {
                synchronization.afterCommit();
            }
            verify(notificationSender)
                    .sendReviewResult(5, 42, "APPLY_REJECTED", "材料不完整");
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void notificationSender_usesRequiresNewTransactionAndSendsRenderedTemplate()
            throws NoSuchMethodException {
        when(templateService.renderTemplate("APPLY_PASSED", Map.of(
                "roleName", "培训合伙人",
                "reason", ""
        ))).thenReturn(new RenderedTemplate("通过", "审核通过"));
        AlliancePartnerNotificationSender sender =
                new AlliancePartnerNotificationSender(templateService, notificationService);

        sender.sendReviewResult(5, 42, "APPLY_PASSED", "");

        verify(notificationService).send(
                42, NotificationType.APPLY_RESULT, "通过", "审核通过", "5", null);
        Transactional transactional = AlliancePartnerNotificationSender.class
                .getMethod(
                        "sendReviewResult",
                        Integer.class,
                        Integer.class,
                        String.class,
                        String.class)
                .getAnnotation(Transactional.class);
        assertEquals(Propagation.REQUIRES_NEW, transactional.propagation());
    }

    private AlliancePartnerApplyRequest validRequest() {
        AlliancePartnerApplyRequest request = new AlliancePartnerApplyRequest();
        request.setContactName("联系人");
        request.setCompanyName("测试公司");
        request.setCompanyPhone("021-12345678");
        request.setCompanyEmail("partner@example.com");
        request.setProvinceId(310000);
        request.setCityId(310100);
        request.setLegalPerson("法人");
        request.setLegalIdCard("310101199001011234");
        request.setContactQq("123456");
        request.setAgreementSigned(true);
        return request;
    }

    private AlliancePartnerApplication pendingApp(Integer id, Integer userId) {
        AlliancePartnerApplication application = new AlliancePartnerApplication();
        application.setId(id);
        application.setUserId(userId);
        application.setPartnerCode("TPC_20260713153000000042");
        application.setContactName("联系人");
        application.setCompanyName("测试公司");
        application.setCompanyPhone("021-12345678");
        application.setCompanyEmail("partner@example.com");
        application.setProvinceId(310000);
        application.setCityId(310100);
        application.setLegalPerson("法人");
        application.setLegalIdCard("310101199001011234");
        application.setAgreementVersion("v1");
        application.setStatus(1);
        return application;
    }
}
