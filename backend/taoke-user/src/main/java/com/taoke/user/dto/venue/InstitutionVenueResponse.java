package com.taoke.user.dto.venue;

import com.taoke.user.entity.InstitutionVenue;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 机构场地响应。
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:00
 */
@Data
public class InstitutionVenueResponse {

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
        r.setDescription(v.getDescription());
        r.setStatus(v.getStatus());
        r.setSortOrder(v.getSortOrder());
        r.setCreatedAt(v.getCreatedAt());
        r.setUpdatedAt(v.getUpdatedAt());
        return r;
    }
}
