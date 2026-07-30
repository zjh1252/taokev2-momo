package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.service.CategoryService;
import com.taoke.common.service.OpsMaterialResolver;
import com.taoke.common.service.RegionService;
import com.taoke.user.api.RoleApplyService;
import com.taoke.user.api.TrainerListItemEnricher;
import com.taoke.user.dto.trainer.TrainerRequest;
import com.taoke.user.mapper.TrainerMapper;
import com.taoke.user.repository.TrainerBookRepository;
import com.taoke.user.repository.TrainerEducationRepository;
import com.taoke.user.repository.TrainerExpertiseCategoryRepository;
import com.taoke.user.repository.TrainerHonorRepository;
import com.taoke.user.repository.TrainerIndustryCategoryRepository;
import com.taoke.user.repository.TrainerRepository;
import com.taoke.user.repository.TrainerWorkExperienceRepository;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.support.PublicTrainerListCache;
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

/**
 * 专家申请头像必填单测。
 *
 * @author Fangxinxin
 * @date 2026-07-29 16:20
 */
@ExtendWith(MockitoExtension.class)
class TrainerServiceImplApplyAvatarTest {

    @Mock private TrainerRepository trainerRepository;
    @Mock private TrainerEducationRepository educationRepository;
    @Mock private TrainerWorkExperienceRepository workExperienceRepository;
    @Mock private TrainerHonorRepository honorRepository;
    @Mock private TrainerExpertiseCategoryRepository expertiseCategoryRepository;
    @Mock private TrainerIndustryCategoryRepository industryCategoryRepository;
    @Mock private TrainerBookRepository trainerBookRepository;
    @Mock private TrainerMapper trainerMapper;
    @Mock private RoleApplyService roleApplyService;
    @Mock private CategoryService categoryService;
    @Mock private RegionService regionService;
    @Mock private UserRepository userRepository;
    @Mock private OpsMaterialResolver opsMaterialResolver;
    @Mock private RoleApplicationChangeLogService changeLogService;
    @Mock private Optional<TrainerListItemEnricher> trainerListItemEnricher;
    @Mock private PublicTrainerListCache publicTrainerListCache;

    @InjectMocks
    private TrainerServiceImpl service;

    @Test
    void apply_rejectsWhenAvatarMissingAndNoExistingUserAvatar() {
        TrainerRequest request = validApplyRequest();
        request.setAvatar(null);
        when(userRepository.findById(1)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class, () -> service.apply(1, request));

        assertEquals("请上传专家头像", exception.getMessage());
        verify(roleApplyService, never()).apply(1, com.taoke.common.enums.BusinessRole.Code.TRAINER);
    }

    private static TrainerRequest validApplyRequest() {
        TrainerRequest request = new TrainerRequest();
        request.setAgreementSigned(true);
        request.setAvatar("https://cdn.example.com/avatar.png");
        return request;
    }
}
