package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.service.RegionService;
import com.taoke.user.dto.venue.InstitutionVenueRequest;
import com.taoke.user.entity.Institution;
import com.taoke.user.repository.InstitutionRepository;
import com.taoke.user.repository.InstitutionVenueRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 机构场地图片必填单测。
 *
 * @author Fangxinxin
 * @date 2026-07-29 16:40
 */
@ExtendWith(MockitoExtension.class)
class InstitutionVenueServiceImplImagesTest {

    @Mock private InstitutionVenueRepository venueRepository;
    @Mock private InstitutionRepository institutionRepository;
    @Mock private RegionService regionService;

    @InjectMocks
    private InstitutionVenueServiceImpl service;

    @Test
    void createVenue_rejectsWhenNoImagesAndNoCover() {
        Institution institution = new Institution();
        institution.setId(3);
        when(institutionRepository.findByUserId(10)).thenReturn(Optional.of(institution));

        InstitutionVenueRequest request = new InstitutionVenueRequest();
        request.setName("上海徐汇主会场");
        request.setImages(List.of());

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> service.createVenue(10, request));

        assertEquals("请至少上传 1 张场地图片", ex.getMessage());
        verify(venueRepository, never()).save(any());
    }
}
