package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.common.service.RegionService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.dto.institution.InstitutionRequest;
import com.taoke.user.entity.Institution;
import com.taoke.user.mapper.InstitutionMapper;
import com.taoke.user.repository.InstitutionRepository;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.support.PublicInstitutionListCache;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InstitutionServiceImplTest {

    @Mock private InstitutionRepository institutionRepository;
    @Mock private InstitutionMapper institutionMapper;
    @Mock private RoleApplyService roleApplyService;
    @Mock private RegionService regionService;
    @Mock private CategoryService categoryService;
    @Mock private OpsMaterialResolver opsMaterialResolver;
    @Mock private UserRepository userRepository;
    @Mock private RoleApplicationChangeLogService changeLogService;
    @Mock private PublicInstitutionListCache publicInstitutionListCache;

    @InjectMocks
    private InstitutionServiceImpl service;

    @Test
    void apply_rejectsWhenLogoMissingAndNoExistingLogo() {
        InstitutionRequest request = validApplyRequest();
        request.setLogoUrl(null);
        when(institutionRepository.findByUserId(1)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class, () -> service.apply(1, request));

        assertEquals("请上传机构 Logo", exception.getMessage());
        verify(roleApplyService, never()).apply(1, com.taoke.common.enums.BusinessRole.Code.INSTITUTION);
    }

    private static InstitutionRequest validApplyRequest() {
        InstitutionRequest request = new InstitutionRequest();
        request.setAgreementSigned(true);
        request.setLogoUrl("https://cdn.example.com/logo.png");
        return request;
    }
}
