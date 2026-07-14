package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplyRequest;
import com.taoke.user.dto.alliance.AllianceLecturer721ApplicationResponse;
import com.taoke.user.entity.AllianceLecturer721Application;
import com.taoke.user.entity.UserRole;
import com.taoke.user.repository.AllianceLecturer721ApplicationRepository;
import com.taoke.user.repository.UserRoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AllianceLecturer721ApplicationServiceImplTest {

    @Mock
    AllianceLecturer721ApplicationRepository repository;

    @Mock
    UserRoleRepository userRoleRepository;

    @Mock
    AllianceLecturer721NotificationSender notificationSender;

    @InjectMocks
    AllianceLecturer721ApplicationServiceImpl service;

    @Test
    void submit_rejectsNonTrainer() {
        when(userRoleRepository.findByUserIdAndRole(1, BusinessRole.Code.TRAINER))
                .thenReturn(Optional.empty());

        BusinessException exception = assertThrows(
                BusinessException.class, () -> service.submit(1, validRequest()));

        assertEquals("仅已通过的专家可申请721讲师合作", exception.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void submit_rejectsInactiveTrainer() {
        UserRole role = new UserRole();
        role.setStatus(2);
        when(userRoleRepository.findByUserIdAndRole(1, BusinessRole.Code.TRAINER))
                .thenReturn(Optional.of(role));

        assertThrows(BusinessException.class, () -> service.submit(1, validRequest()));
        verify(repository, never()).save(any());
    }

    @Test
    void submit_createsPendingWithCode() {
        stubActiveTrainer(42);
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> {
            AllianceLecturer721Application application = invocation.getArgument(0);
            application.setId(10);
            return application;
        });

        AllianceLecturer721ApplicationResponse response = service.submit(42, validRequest());

        assertEquals(1, response.getStatus());
        assertTrue(response.getApplicationCode().startsWith("L721_"));
        assertTrue(response.getApplicationCode().endsWith("000042"));
        assertEquals("张三", response.getLecturerName());
        assertEquals("https://cdn.example/sign.png", response.getSignatureUrl());
    }

    @Test
    void submit_rejectsWhenPendingExists() {
        stubActiveTrainer(1);
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 1))
                .thenReturn(Optional.of(new AllianceLecturer721Application()));

        assertThrows(BusinessException.class, () -> service.submit(1, validRequest()));
        verify(repository, never()).save(any());
    }

    @Test
    void approve_sendsApplyPassed() {
        AllianceLecturer721Application application = pendingApp(5, 42);
        when(repository.findById(5)).thenReturn(Optional.of(application));
        when(repository.approveIfPending(eq(5), any(LocalDateTime.class), eq(99))).thenReturn(1);

        service.approve(5, 99);

        verify(notificationSender).sendReviewResult(5, 42, "APPLY_PASSED", "");
    }

    @Test
    void reject_requiresReason() {
        assertThrows(BusinessException.class, () -> service.reject(5, 99, ""));
    }

    private void stubActiveTrainer(Integer userId) {
        UserRole role = new UserRole();
        role.setStatus(1);
        when(userRoleRepository.findByUserIdAndRole(userId, BusinessRole.Code.TRAINER))
                .thenReturn(Optional.of(role));
    }

    private AllianceLecturer721ApplyRequest validRequest() {
        AllianceLecturer721ApplyRequest request = new AllianceLecturer721ApplyRequest();
        request.setLecturerName("张三");
        request.setIdCardNo("310101199001011234");
        request.setCoopYears(3);
        request.setDailyFee(new BigDecimal("8000.00"));
        request.setAddress("上海市");
        request.setPhone("13800138000");
        request.setWechat("wx123");
        request.setEmail("a@b.com");
        request.setBankName("工商银行");
        request.setBankAccount("622200001");
        request.setSignatureUrl("https://cdn.example/sign.png");
        request.setAgreementSigned(true);
        request.setAgreementVersion("v1");
        return request;
    }

    private AllianceLecturer721Application pendingApp(Integer id, Integer userId) {
        AllianceLecturer721Application application = new AllianceLecturer721Application();
        application.setId(id);
        application.setUserId(userId);
        application.setApplicationCode("L721_TEST");
        application.setStatus(1);
        return application;
    }
}
