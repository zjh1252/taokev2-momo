package com.taoke.user.dto.venue;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.user.entity.InstitutionVenue;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * 机构场地响应。
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:00
 */
@Slf4j
@Data
public class InstitutionVenueResponse {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

    private Integer id;

    private Integer institutionId;

    private String name;

    private Integer provinceId;

    private String provinceName;

    private Integer cityId;

    private String cityName;

    private Integer districtId;

    private String districtName;

    private String address;

    private Integer capacity;

    private String coverUrl;

    /** 场地多图 URL 列表 */
    private List<String> images;

    private String description;

    private Integer status;

    private Integer sortOrder;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public static InstitutionVenueResponse from(InstitutionVenue v) {
        InstitutionVenueResponse r = new InstitutionVenueResponse();
        r.setId(v.getId());
        r.setInstitutionId(v.getInstitutionId());
        r.setName(v.getName());
        r.setProvinceId(v.getProvinceId());
        r.setCityId(v.getCityId());
        r.setDistrictId(v.getDistrictId());
        r.setAddress(v.getAddress());
        r.setCapacity(v.getCapacity());
        r.setCoverUrl(v.getCoverUrl());
        r.setImages(parseImages(v.getImages()));
        r.setDescription(v.getDescription());
        r.setStatus(v.getStatus());
        r.setSortOrder(v.getSortOrder());
        r.setCreatedAt(v.getCreatedAt());
        r.setUpdatedAt(v.getUpdatedAt());
        return r;
    }

    private static List<String> parseImages(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            List<String> list = OBJECT_MAPPER.readValue(json, STRING_LIST_TYPE);
            return list != null ? list : Collections.emptyList();
        } catch (Exception ex) {
            log.warn("解析 institution_venues.images JSON 失败: {}", json, ex);
            return Collections.emptyList();
        }
    }
}
