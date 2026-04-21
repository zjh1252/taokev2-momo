package com.taoke.user.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.service.RegionService;
import com.taoke.user.api.InstitutionVenueService;
import com.taoke.user.dto.venue.InstitutionVenueRequest;
import com.taoke.user.dto.venue.InstitutionVenueResponse;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.InstitutionVenue;
import com.taoke.user.repository.InstitutionRepository;
import com.taoke.user.repository.InstitutionVenueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 机构场地服务实现。
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstitutionVenueServiceImpl implements InstitutionVenueService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    /** 单个场地最多 9 张图片，避免前端体验和存储压力 */
    private static final int MAX_IMAGES = 9;

    private final InstitutionVenueRepository venueRepository;
    private final InstitutionRepository institutionRepository;
    private final RegionService regionService;

    @Override
    @Transactional(readOnly = true)
    public List<InstitutionVenueResponse> listMyVenues(Integer institutionUserId) {
        Institution inst = requireInstitution(institutionUserId);
        return enrich(venueRepository.findByInstitutionIdOrderBySortOrderDescIdDesc(inst.getId()));
    }

    @Override
    @Transactional
    public InstitutionVenueResponse createVenue(Integer institutionUserId, InstitutionVenueRequest req) {
        Institution inst = requireInstitution(institutionUserId);
        InstitutionVenue v = new InstitutionVenue();
        v.setInstitutionId(inst.getId());
        applyRequest(v, req);
        v.setStatus(req.getStatus() != null ? req.getStatus() : 1);
        v.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        v = venueRepository.save(v);
        return enrichOne(v);
    }

    @Override
    @Transactional
    public InstitutionVenueResponse updateVenue(Integer institutionUserId, Integer venueId, InstitutionVenueRequest req) {
        Institution inst = requireInstitution(institutionUserId);
        InstitutionVenue v = requireOwnedVenue(inst.getId(), venueId);
        applyRequest(v, req);
        if (req.getStatus() != null) v.setStatus(req.getStatus());
        if (req.getSortOrder() != null) v.setSortOrder(req.getSortOrder());
        v = venueRepository.save(v);
        return enrichOne(v);
    }

    @Override
    @Transactional
    public void toggleStatus(Integer institutionUserId, Integer venueId) {
        Institution inst = requireInstitution(institutionUserId);
        InstitutionVenue v = requireOwnedVenue(inst.getId(), venueId);
        v.setStatus(v.getStatus() != null && v.getStatus() == 1 ? 0 : 1);
        venueRepository.save(v);
    }

    @Override
    @Transactional
    public void deleteVenue(Integer institutionUserId, Integer venueId) {
        Institution inst = requireInstitution(institutionUserId);
        InstitutionVenue v = requireOwnedVenue(inst.getId(), venueId);
        venueRepository.delete(v);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InstitutionVenueResponse> listPublicByInstitutionId(Integer institutionId) {
        if (institutionId == null) return List.of();
        return enrich(venueRepository.findByInstitutionIdOrderBySortOrderDescIdDesc(institutionId)
                .stream().filter(v -> v.getStatus() != null && v.getStatus() == 1).toList());
    }

    // ============================================================
    // 私有
    // ============================================================

    private Institution requireInstitution(Integer userId) {
        return institutionRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FORBIDDEN, "当前用户不是机构主体"));
    }

    private InstitutionVenue requireOwnedVenue(Integer institutionId, Integer venueId) {
        InstitutionVenue v = venueRepository.findById(venueId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "场地不存在"));
        if (!Objects.equals(v.getInstitutionId(), institutionId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "无权操作此场地");
        }
        return v;
    }

    private void applyRequest(InstitutionVenue v, InstitutionVenueRequest req) {
        v.setName(req.getName());
        v.setProvinceId(req.getProvinceId());
        v.setCityId(req.getCityId());
        v.setDistrictId(req.getDistrictId());
        v.setAddress(req.getAddress());
        v.setCapacity(req.getCapacity());
        v.setCoverUrl(req.getCoverUrl());
        v.setDescription(req.getDescription());
        v.setImages(serializeImages(req.getImages()));
        // 兼容：未单独传 coverUrl 时，自动取首图作为封面
        if ((req.getCoverUrl() == null || req.getCoverUrl().isBlank())
                && req.getImages() != null && !req.getImages().isEmpty()) {
            v.setCoverUrl(req.getImages().get(0));
        }
    }

    /** 将图片 URL 列表序列化为 JSON；超过上限做截断；空列表存 null */
    private String serializeImages(List<String> images) {
        if (images == null || images.isEmpty()) {
            return null;
        }
        List<String> cleaned = images.stream()
                .filter(s -> s != null && !s.isBlank())
                .distinct()
                .limit(MAX_IMAGES)
                .toList();
        if (cleaned.isEmpty()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(cleaned);
        } catch (Exception ex) {
            log.warn("序列化场地图片列表失败: {}", cleaned, ex);
            return null;
        }
    }

    private InstitutionVenueResponse enrichOne(InstitutionVenue v) {
        return enrich(List.of(v)).get(0);
    }

    /** 批量回填省/市/区名称 */
    private List<InstitutionVenueResponse> enrich(List<InstitutionVenue> venues) {
        if (venues == null || venues.isEmpty()) return List.of();
        Set<Integer> regionIds = new HashSet<>();
        for (InstitutionVenue v : venues) {
            if (v.getProvinceId() != null && v.getProvinceId() > 0) regionIds.add(v.getProvinceId());
            if (v.getCityId() != null && v.getCityId() > 0) regionIds.add(v.getCityId());
            if (v.getDistrictId() != null && v.getDistrictId() > 0) regionIds.add(v.getDistrictId());
        }
        Map<Integer, String> nameMap = regionIds.isEmpty()
                ? Map.of() : regionService.getNamesByIds(regionIds);
        List<InstitutionVenueResponse> result = new ArrayList<>(venues.size());
        for (InstitutionVenue v : venues) {
            InstitutionVenueResponse r = InstitutionVenueResponse.from(v);
            if (v.getProvinceId() != null) r.setProvinceName(nameMap.get(v.getProvinceId()));
            if (v.getCityId() != null) r.setCityName(nameMap.get(v.getCityId()));
            if (v.getDistrictId() != null) r.setDistrictName(nameMap.get(v.getDistrictId()));
            result.add(r);
        }
        return result;
    }
}
